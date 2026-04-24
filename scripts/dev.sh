#!/bin/bash
# scripts/dev.sh — Start the Finance Hub development server via Docker
#
# Usage:
#   ./scripts/dev.sh             # start (or restart) the dev server
#   ./scripts/dev.sh --build     # force-rebuild the image before starting
#   ./scripts/dev.sh --logs      # attach to logs of an already-running server
#   ./scripts/dev.sh --stop      # stop the dev server
#   ./scripts/dev.sh --clean     # stop and remove the container + db volume
#
# The server auto-reloads when Python source files under src/ change.
# Template and static file changes are reflected immediately on next request.
# Access the app at http://localhost:5000

set -euo pipefail

COMPOSE="docker compose"
SERVICE="web"

case "${1:-}" in
  --build)
    echo "→ Rebuilding dev image…"
    $COMPOSE build --no-cache
    echo "→ Starting dev server…"
    $COMPOSE up
    ;;
  --logs)
    $COMPOSE logs -f $SERVICE
    ;;
  --stop)
    echo "→ Stopping dev server…"
    $COMPOSE stop
    ;;
  --clean)
    echo "→ Stopping and removing containers and volume…"
    $COMPOSE down -v
    ;;
  *)
    echo "→ Starting Finance Hub dev server…"
    echo "   App will be available at http://localhost:${FINANCE_PORT:-5000}"
    echo "   Source changes in src/ auto-reload the server"
    echo "   Press Ctrl+C to stop"
    echo ""
    # Build if image doesn't exist, otherwise use existing
    $COMPOSE up --build
    ;;
esac
