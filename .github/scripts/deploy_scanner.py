"""Deploy a prebuilt ClamAV bundle into this student's own home only."""
import datetime
import hashlib
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

home = Path.home()
assert home.name == 's20230204112'
archive = home / 'scanner-release.tar.gz'
checksum = (home / 'scanner-release.tar.gz.sha256').read_text().split()[0]
if hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest() != checksum:
    raise RuntimeError('Scanner release checksum mismatch')
root = home / 'truthhub-scanner'
root.mkdir(mode=0o700, exist_ok=True)
root.chmod(0o700)
release = root / ('release-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%f'))
release.mkdir(mode=0o700)
with tarfile.open(archive, 'r:gz') as bundle:
    for member in bundle.getmembers():
        path = Path(member.name)
        if path.is_absolute() or '..' in path.parts or member.isdev():
            raise RuntimeError('Unsafe scanner archive')
    # Python's data filter permits safe internal library symlinks only.
    bundle.extractall(release, filter='data')
current = root / 'current'
previous = current.resolve() if current.exists() else None
pending = root / '.current-new'
if pending.is_symlink(): pending.unlink()
pending.symlink_to(release.name, target_is_directory=True)
os.replace(pending, current)
wrapper = root / 'scan'
wrapper.write_text(r"""#!/bin/sh
set -eu
ROOT=/home/s20230204112/truthhub-scanner
RELEASE=$(readlink -f "$ROOT/current")
export LD_LIBRARY_PATH="$RELEASE/runtime/usr/local/lib"
# Keep scans sequential, run at low CPU priority, and cap address space at 1.75 GiB.
# --no-fork makes the real scanner keep the lock and receive timeout signals.
ulimit -v 1835008
exec /usr/bin/flock --nonblock --conflict-exit-code 2 --no-fork "$ROOT/scan.lock" \
    /usr/bin/nice -n 19 "$RELEASE/runtime/usr/local/bin/clamscan" \
    --database="$RELEASE/database" --max-filesize=10M --max-scansize=60M \
    --max-recursion=20 --max-files=1000 "$@"
""", encoding='utf-8')
wrapper.chmod(0o700)
fixture = root / '.clean-verification.txt'
fixture.write_text('TruthHub clean scanner verification file.\n')
try:
    result = subprocess.run([str(wrapper), '--no-summary', '--fail-if-cvd-older-than=7', '--alert-exceeds-max=yes', str(fixture)], capture_output=True, text=True, timeout=60)
    print(result.stdout)
    print(result.stderr)
    if result.returncode:
        if previous:
            pending.symlink_to(previous.name, target_is_directory=True)
            os.replace(pending, current)
        raise RuntimeError('VPS scanner verification failed; application scanner setting was not changed')
finally:
    fixture.unlink(missing_ok=True)
env = home / 'laravel/.env'
content = env.read_text()
setting = 'CLAMAV_BINARY=' + str(wrapper)
if re.search(r'^CLAMAV_BINARY=.*$', content, re.M):
    content = re.sub(r'^CLAMAV_BINARY=.*$', setting, content, flags=re.M)
else:
    content += '\n' + setting + '\n'
env.write_text(content)
env.chmod(0o600)
subprocess.run(['php', 'artisan', 'optimize'], cwd=home / 'laravel', check=True)
archive.unlink()
(home / 'scanner-release.tar.gz.sha256').unlink()
# Keep the immediately previous working release for rollback; discard older own releases.
for old in root.glob('release-*'):
    if old not in [release, previous]:
        import shutil
        shutil.rmtree(old)
print('TruthHub scanner configured with fresh definitions; no system packages or services changed')
