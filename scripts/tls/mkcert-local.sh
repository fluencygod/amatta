#!/usr/bin/env bash
set -euo pipefail

# Generate local trusted certs for HTTPS dev using mkcert
# - Output dir: apps/backend/certs
# - Files: localhost.pem, localhost-key.pem

ROOT_DIR="$(cd "$(dirname "$0")"/../.. && pwd)"
OUT_DIR="$ROOT_DIR/apps/backend/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert not found. Please install it first." >&2
  echo "macOS (Homebrew): brew install mkcert nss && mkcert -install" >&2
  echo "More: https://github.com/FiloSottile/mkcert" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

echo "Ensuring local CA is installed (mkcert -install) ..."
# mkcert -install may attempt Java/Firefox trust integration and print warnings.
# Allow it to continue even if those parts fail.
set +e
mkcert -install
rc_install=$?
set -e
if [ $rc_install -ne 0 ]; then
  echo "mkcert -install returned non-zero (likely Java/Firefox integration). Continuing anyway..." >&2
fi

echo "Generating certificates in $OUT_DIR ..."
set +e
mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
rc_gen=$?
set -e

if [ $rc_gen -ne 0 ]; then
  echo "mkcert returned non-zero (possibly due to optional trust store hooks). Verifying files..." >&2
fi

if [ ! -f "$OUT_DIR/localhost.pem" ] || [ ! -f "$OUT_DIR/localhost-key.pem" ]; then
  echo "Failed to create cert files. Please try manually:" >&2
  echo "  mkcert -install" >&2
  echo "  mkcert -cert-file $OUT_DIR/localhost.pem -key-file $OUT_DIR/localhost-key.pem localhost 127.0.0.1 ::1" >&2
  exit 1
fi

echo "Done. Files:"
ls -la "$OUT_DIR" | sed -n '1,200p'

echo
echo "Use with uvicorn:"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000 \\
    --ssl-certfile $OUT_DIR/localhost.pem \\
    --ssl-keyfile $OUT_DIR/localhost-key.pem"

