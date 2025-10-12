#!/usr/bin/env bash
set -euo pipefail

# Generate local trusted certs for HTTPS dev using mkcert
# - Output dir: apps/backend/certs
# - Files: localhost+2.pem, localhost+2-key.pem (mkcert defaults)

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

echo "Generating certificates in $OUT_DIR ..."
mkcert localhost 127.0.0.1 ::1

echo "Done. Files:"
ls -la "$OUT_DIR" | sed -n '1,200p'

echo
echo "Use with uvicorn:"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000 \\\n+    --ssl-certfile $OUT_DIR/localhost+2.pem \\\n+    --ssl-keyfile $OUT_DIR/localhost+2-key.pem"

