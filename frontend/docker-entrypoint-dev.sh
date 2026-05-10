#!/bin/sh
# Sync /app/node_modules with the bind-mounted package files.
# docker-compose mounts an anonymous volume over node_modules (see root docker-compose.yml),
# which hides deps baked into the image; run npm ci when the lockfile changes or on first boot.
set -e
cd /app

if [ ! -f package-lock.json ] || [ ! -f package.json ]; then
  echo "docker-entrypoint-dev: package.json or package-lock.json missing in /app" >&2
  exit 1
fi

INPUT_HASH=$(cat package.json package-lock.json | sha256sum | awk '{print $1}')
HASH_FILE="node_modules/.npm-sync-hash"

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$INPUT_HASH" ]; then
  echo "docker-entrypoint-dev: syncing node_modules (npm ci)…"
  npm ci
  mkdir -p node_modules
  printf '%s' "$INPUT_HASH" > "$HASH_FILE"
fi

exec "$@"
