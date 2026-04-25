#!/usr/bin/env bash
# Local MkDocs preview without a global mkdocs install.
# Run from repo root: ./scripts/serve-docs.sh [-- mkdocs-serve-args...]
#
# Creates .venv if missing, installs requirements-docs.txt, then runs
# mkdocs serve via the venv interpreter (fixes "mkdocs: command not found").
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

VENV="$REPO_ROOT/.venv"
REQ="$REPO_ROOT/requirements-docs.txt"

if [[ ! -f "$REQ" ]]; then
  echo "Missing $REQ" >&2
  exit 1
fi

if [[ ! -d "$VENV" ]]; then
  echo "Creating venv at .venv …" >&2
  python3 -m venv "$VENV"
fi

echo "Installing doc dependencies …" >&2
"$VENV/bin/pip" install -q -r "$REQ"

MKDOCS_ARGS=()
if [[ "${1-}" == "--" ]]; then
  shift
  MKDOCS_ARGS+=("$@")
elif [[ $# -gt 0 ]]; then
  MKDOCS_ARGS+=("$@")
fi

exec "$VENV/bin/python" -m mkdocs serve "${MKDOCS_ARGS[@]}"
