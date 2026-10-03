#!/usr/bin/env bash
set -euo pipefail

# Everything is prepared on GitHub, then copied as a release to the student's home.
VERSION=1.5.4
PACKAGE="clamav-${VERSION}.linux.x86_64.deb"
URL="https://github.com/Cisco-Talos/clamav/releases/download/clamav-${VERSION}/${PACKAGE}"
curl --fail --location --retry 3 "$URL" -o "$PACKAGE"
printf '%s  %s\n' '28d6efc5b4423e7830c3559339552eb53870a9eac51ac4efb37d60530d329886' "$PACKAGE" | sha256sum --check
mkdir -p scanner-bundle/runtime scanner-bundle/database
# Extract the official precompiled runtime; do not install it on the VPS.
dpkg-deb --extract "$PACKAGE" scanner-bundle/runtime

# Official ClamAV images include signed databases and receive updated definitions.
# The image is used on GitHub only; no Docker container is created on the VPS.
docker pull clamav/clamav:1.5
CONTAINER=$(docker create clamav/clamav:1.5)
trap 'docker rm "$CONTAINER"' EXIT
docker cp "$CONTAINER:/var/lib/clamav/." scanner-bundle/database/
chmod -R u+rwX scanner-bundle
find scanner-bundle/database -maxdepth 1 -type f -name "freshclam.dat" -delete
test -s scanner-bundle/database/daily.cvd || test -s scanner-bundle/database/daily.cld
test -s scanner-bundle/database/main.cvd || test -s scanner-bundle/database/main.cld

export LD_LIBRARY_PATH="$PWD/scanner-bundle/runtime/usr/local/lib"
SCANNER="$PWD/scanner-bundle/runtime/usr/local/bin/clamscan"
"$SCANNER" --version
mkdir -p scanner-fixtures
printf 'TruthHub scanner clean verification file.\n' > scanner-fixtures/clean.txt
python3 - <<'PY'
from pathlib import Path
# Standard harmless EICAR antivirus test pattern, not executable malware.
Path('scanner-fixtures/eicar.txt').write_bytes(b'X5O!P%@AP[4'+bytes([92])+b'PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')
PY
# Exercise the same memory ceiling and safety flags that the VPS wrapper uses.
(ulimit -v 1835008; "$SCANNER" --cvdcertsdir="$PWD/scanner-bundle/runtime/usr/local/etc/certs" --database="$PWD/scanner-bundle/database" --no-summary --fail-if-cvd-older-than=7 --alert-exceeds-max=yes scanner-fixtures/clean.txt)
set +e
(ulimit -v 1835008; "$SCANNER" --cvdcertsdir="$PWD/scanner-bundle/runtime/usr/local/etc/certs" --database="$PWD/scanner-bundle/database" --no-summary --fail-if-cvd-older-than=7 --alert-exceeds-max=yes scanner-fixtures/eicar.txt)
RESULT=$?
set -e
test "$RESULT" -eq 1
# Record the official image identity for review.
docker image inspect clamav/clamav:1.5 --format '{{json .RepoDigests}}' > scanner-bundle/database-source.json
printf '%s\n' "$VERSION" > scanner-bundle/version.txt
# Avoid keeping tests, source packages, or container tooling in the deployed release.
tar -czf scanner-release.tar.gz -C scanner-bundle .
sha256sum scanner-release.tar.gz > scanner-release.tar.gz.sha256
