#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: make rollback TAG=<tag>" >&2
  exit 1
fi
tag="$1"

root_dir=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "$root_dir" ]]; then
  echo "Not inside a git repository." >&2
  exit 1
fi

cd "$root_dir"

echo "Rolling back to tag: ${tag}"
git reset --hard "$tag"
echo "Rolled back to ${tag}"

