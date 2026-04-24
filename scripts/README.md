# Scripts

Utility scripts for the Finance Hub project. All scripts are parameterized and reusable.

---

## `dev.sh` — Development server

Starts the Finance Hub development server via Docker Compose with live reload.

### Usage

```bash
# Start dev server (builds image on first run)
./scripts/dev.sh

# Force-rebuild the image, then start
./scripts/dev.sh --build

# Attach to logs of an already-running server
./scripts/dev.sh --logs

# Stop the server
./scripts/dev.sh --stop

# Stop and destroy all containers + database volume
./scripts/dev.sh --clean
```

### What it does

1. Builds the Docker image using the `dev` stage of `Dockerfile` (Werkzeug reloader + watchdog)
2. Mounts `src/` and `run.py` as volumes — Python edits are reflected without rebuilding
3. Flask debug mode is on: server restarts automatically when `.py` files change
4. Template and static file changes take effect on next browser refresh
5. SQLite database is persisted in a named Docker volume (`finance-db`)

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FINANCE_PORT` | `5000` | Host port mapped to the container |
| `FINANCE_DB_URL` | *(auto)* | SQLite path inside container, or PostgreSQL URL |
| `FINANCE_DEBUG` | `true` | Enable Flask debug mode and reloader |

### Access

App runs at **http://localhost:5000** (or `FINANCE_PORT` if overridden).

---

## Adding a New Script

When you add a script here, document it above with:

- **Purpose**: What the script does
- **Usage**: Command-line invocation with all flags
- **Inputs**: Required files or arguments
- **Outputs**: What files are produced
- **Dependencies**: System packages or Python packages required
- **Exit Codes**: Non-zero codes and their meanings
