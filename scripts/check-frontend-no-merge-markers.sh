#!/bin/bash
# Fail if unresolved git merge markers appear under frontend/src (breaks Vite / white page).
#
# Usage (repo root):
#   ./scripts/check-frontend-no-merge-markers.sh
#
# Exit codes: 0 = clean; 1 = markers found; 2 = missing frontend/src

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/frontend/src"

if [[ ! -d "$TARGET" ]]; then
  echo "check-frontend-no-merge-markers: missing $TARGET" >&2
  exit 2
fi

matches=$(
  grep -RIn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    -E '^<<<<<<<|^>>>>>>>' "$TARGET" 2>/dev/null || true
)

if [[ -n "${matches}" ]]; then
  printf '%s\n' "${matches}" >&2
  echo "" >&2
  echo "check-frontend-no-merge-markers: unresolved merge markers under frontend/src — remove before Vite can compile." >&2
  exit 1
fi

echo "check-frontend-no-merge-markers: OK (no ^<<<<<<< or ^>>>>>>> in ${TARGET})"
