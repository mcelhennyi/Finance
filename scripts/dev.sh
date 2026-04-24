#!/bin/bash
# scripts/dev.sh — Start the Finance Hub development stack via Docker
#
# Usage:
#   ./scripts/dev.sh                    # start (or restart) both services
#   ./scripts/dev.sh --build            # force-rebuild images, then start
#   ./scripts/dev.sh --fresh            # remove DB volume, then start (empty DB)
#   ./scripts/dev.sh --seed             # ingest data/seed-statements/*.csv, then start
#   ./scripts/dev.sh --fresh --seed     # wipe DB, seed from CSVs, then start
#   ./scripts/dev.sh --logs             # attach to logs of running services
#   ./scripts/dev.sh --logs api         # logs for api | web
#   ./scripts/dev.sh --stop             # stop the dev stack
#   ./scripts/dev.sh --clean            # stop and remove containers + db volume (no start)
#
# Seed directory (gitignored contents): data/seed-statements/
#
# Services:
#   api  — FastAPI backend on http://localhost:3500  (uvicorn --reload); see docs/PORTS.md
#   web  — React/Vite frontend on http://localhost:3501 (vite --host)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose"

run_seed() {
  mkdir -p data/seed-statements
  echo "→ Seeding database from data/seed-statements/ …"
  $COMPOSE run --rm api python -m finance.dev_seed
}

case "${1:-}" in
  --logs)
    $COMPOSE logs -f "${2:-}"
    exit 0
    ;;
  --stop)
    echo "→ Stopping dev stack…"
    $COMPOSE stop
    exit 0
    ;;
  --clean)
    echo "→ Stopping and removing containers and volume…"
    $COMPOSE down -v
    exit 0
    ;;
esac

FRESH=false
SEED=false
BUILD_NO_CACHE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fresh)
      FRESH=true
      shift
      ;;
    --seed)
      SEED=true
      shift
      ;;
    --build)
      BUILD_NO_CACHE=true
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "See header in scripts/dev.sh for usage." >&2
      exit 1
      ;;
  esac
done

if $FRESH; then
  echo "→ Removing containers and database volume (--fresh)…"
  $COMPOSE down -v
fi

if $SEED; then
  run_seed
fi

if $BUILD_NO_CACHE; then
  echo "→ Rebuilding dev images (--build)…"
  $COMPOSE build --no-cache
fi

echo "→ Starting Finance Hub dev stack…"
echo "   API  → http://localhost:3500   (FastAPI, auto-reload on src/ changes)"
echo "   UI   → http://localhost:3501   (React/Vite, HMR enabled)"
echo "   Press Ctrl+C to stop"
echo ""
$COMPOSE up
