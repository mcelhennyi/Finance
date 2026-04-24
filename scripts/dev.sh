#!/bin/bash
# scripts/dev.sh — Start the Finance Hub development stack via Docker
#
# Usage:
#   ./scripts/dev.sh             # start (or restart) both services
#   ./scripts/dev.sh --build     # force-rebuild images before starting
#   ./scripts/dev.sh --logs      # attach to logs of running services
#   ./scripts/dev.sh --logs api  # logs for a specific service (api | web)
#   ./scripts/dev.sh --stop      # stop the dev stack
#   ./scripts/dev.sh --clean     # stop and remove containers + db volume
#
# Services:
#   api  — FastAPI backend on http://localhost:3500  (uvicorn --reload); see docs/PORTS.md
#   web  — React/Vite frontend on http://localhost:3501 (vite --host)

set -euo pipefail

COMPOSE="docker compose"

case "${1:-}" in
  --build)
    echo "→ Rebuilding dev images…"
    $COMPOSE build --no-cache
    echo "→ Starting dev stack…"
    $COMPOSE up
    ;;
  --logs)
    $COMPOSE logs -f ${2:-}
    ;;
  --stop)
    echo "→ Stopping dev stack…"
    $COMPOSE stop
    ;;
  --clean)
    echo "→ Stopping and removing containers and volume…"
    $COMPOSE down -v
    ;;
  *)
    echo "→ Starting Finance Hub dev stack…"
    echo "   API  → http://localhost:3500   (FastAPI, auto-reload on src/ changes)"
    echo "   UI   → http://localhost:3501   (React/Vite, HMR enabled)"
    echo "   Press Ctrl+C to stop"
    echo ""
    $COMPOSE up --build
    ;;
esac
