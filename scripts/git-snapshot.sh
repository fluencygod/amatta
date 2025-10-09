#!/usr/bin/env bash
set -euo pipefail

# Run from anywhere inside the repo
root_dir=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "$root_dir" ]]; then
  echo "Not inside a git repository." >&2
  exit 1
fi

cd "$root_dir"

tag_input=${1:-}
ts=$(date +"%Y%m%d-%H%M%S")
tag=${tag_input:-news-snap-${ts}}

echo "Creating snapshot commit and tag: ${tag}"
git add news || true
git add news/ -A || true
git commit -m "chore(snapshot): ${tag}" || echo "Nothing to commit, creating tag only"
git tag -a "${tag}" -m "snapshot ${tag}"
echo "Snapshot created: ${tag}"

