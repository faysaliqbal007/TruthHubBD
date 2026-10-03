"""Issue/renew TruthHub's certificate on the runner; no installs on the VPS."""
import base64
import datetime
import json
import os
import subprocess
import requests

from acme import challenges, client, errors, messages
import josepy
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

DOMAIN = "truthhub.austattendance.online"
USER = "s20230204112"
HOST = "187.52.122.100"
DIRECTORY = "https://acme-v02.api.letsencrypt.org/directory"
KEY = os.environ["DEPLOY_KEY_PATH"]
SSH = ["ssh", "-i", KEY, "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", f"{USER}@{HOST}", "python3 -"]
REMOTE = r"""
import base64,json,os,pathlib,re,subprocess,tempfile
home=pathlib.Path.home()
assert home.name=='s20230204112'
tls=home/'truthhub-tls'
tls.mkdir(mode=0o700,exist_ok=True);tls.chmod(0o700)
def write(path,content,mode):
    fd,tmp=tempfile.mkstemp(dir=path.parent,prefix='.pending-')
    try:
        with os.fdopen(fd,'wb') as stream: stream.write(content)
        os.chmod(tmp,mode);os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
if data['action']=='state':
    print(json.dumps({name:base64.b64encode((tls/name).read_bytes()).decode() if (tls/name).exists() else None for name in ['acme-account.pem','privkey.pem','fullchain.pem']}))
elif data['action']=='tls':
    for name,content in data['files'].items():
        assert name in ['acme-account.pem','privkey.pem','fullchain.pem']
        write(tls/name,base64.b64decode(content),0o600)
elif data['action'] in ['challenge','cleanup']:
    token=data['token'];assert re.fullmatch(r'[A-Za-z0-9_-]+',token)
    root=home/'laravel/public/.well-known/acme-challenge'
    root.mkdir(parents=True,exist_ok=True);path=root/token
    if data['action']=='challenge':
        write(path,data['content'].encode(),0o644)
        subprocess.run(['setfacl','-m','u:www-data:rX',str(root.parent),str(root),str(path)],check=True)
    elif path.exists(): path.unlink()
elif data['action']=='reload':
    site=pathlib.Path('/etc/nginx/sites-available/truthhub.austattendance.online').read_text()
    if str(tls/'fullchain.pem') in site:
        subprocess.run(['sudo','-n','nginx','-t'],check=True)
        subprocess.run(['sudo','-n','systemctl','reload','nginx'],check=True)
        print('nginx configuration passed; certificate reloaded')
"""

def remote(data):
    encoded = base64.b64encode(json.dumps(data).encode()).decode()
    source = "data=__import__('json').loads(__import__('base64').b64decode('" + encoded + "'))\n" + REMOTE
    result = subprocess.run(SSH, input=source.encode(), capture_output=True, timeout=60)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace"))
    return result.stdout.decode()


def pem(key):
    return key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())


def save(files):
    remote({"action": "tls", "files": {name: base64.b64encode(value).decode() for name, value in files.items()}})


def main():
    state = {name: base64.b64decode(value) if value else None for name, value in json.loads(remote({"action": "state"})).items()}
    if state["fullchain.pem"]:
        certificate = x509.load_pem_x509_certificate(state["fullchain.pem"])
        expiry = certificate.not_valid_after_utc
        names = certificate.extensions.get_extension_for_class(x509.SubjectAlternativeName).value.get_values_for_type(x509.DNSName)
        if DOMAIN not in names:
            raise RuntimeError("Stored certificate is for a different domain")
        if expiry > datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30):
            print(f"Certificate is valid until {expiry.isoformat()}; renewal not needed")
            return
    account = serialization.load_pem_private_key(state["acme-account.pem"], password=None) if state["acme-account.pem"] else rsa.generate_private_key(public_exponent=65537, key_size=3072)
    if not state["acme-account.pem"]:
        save({"acme-account.pem": pem(account)})
    account_jwk = josepy.JWKRSA(key=account)
    network = client.ClientNetwork(account_jwk, user_agent="TruthHubBD-certificate-maintenance/1.0")
    directory = client.ClientV2.get_directory(DIRECTORY, network)
    issuer = client.ClientV2(directory, net=network)
    try:
        issuer.new_account(messages.NewRegistration.from_data(terms_of_service_agreed=True))
    except errors.ConflictError as conflict:
        issuer.query_registration(messages.RegistrationResource(uri=conflict.location, body=messages.Registration()))
    domain_key = serialization.load_pem_private_key(state["privkey.pem"], password=None) if state["privkey.pem"] else rsa.generate_private_key(public_exponent=65537, key_size=2048)
    csr = x509.CertificateSigningRequestBuilder().subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, DOMAIN)])).add_extension(x509.SubjectAlternativeName([x509.DNSName(DOMAIN)]), critical=False).sign(domain_key, hashes.SHA256())
    order = issuer.new_order(csr.public_bytes(serialization.Encoding.PEM))
    tokens = []
    try:
        for authorization in order.authorizations:
            if authorization.body.status == messages.STATUS_VALID:
                continue
            challenge = next(item for item in authorization.body.challenges if isinstance(item.chall, challenges.HTTP01))
            response, validation = challenge.response_and_validation(account_jwk)
            token = challenge.chall.encode("token")
            remote({"action": "challenge", "token": token, "content": validation})
            tokens.append(token)
            fetched = requests.get(f"http://{DOMAIN}/.well-known/acme-challenge/{token}", timeout=30).text
            if fetched != validation:
                raise RuntimeError("Public HTTP challenge did not match")
            issuer.answer_challenge(challenge, response)
        final = issuer.poll_and_finalize(order, deadline=datetime.datetime.now() + datetime.timedelta(seconds=120))
        certificate = x509.load_pem_x509_certificate(final.fullchain_pem.encode())
        if certificate.public_key().public_numbers() != domain_key.public_key().public_numbers():
            raise RuntimeError("Certificate and private key do not match")
        save({"privkey.pem": pem(domain_key), "fullchain.pem": final.fullchain_pem.encode()})
        print(f"Issued certificate for {DOMAIN}; expires {certificate.not_valid_after_utc.isoformat()}")
        print(remote({"action": "reload"}).strip())
    finally:
        for token in tokens:
            remote({"action": "cleanup", "token": token})


if __name__ == "__main__":
    main()
