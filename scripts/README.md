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

1. Builds and starts the **api** and **web** services from `docker-compose.yml` (FastAPI + Vite, with reload)
2. Persists SQLite in a named Docker volume (`finance-db`)

Host ports are defined in **[docs/PORTS.md](../docs/PORTS.md)**.

### Environment variables

Compose sets service env vars (see `docker-compose.yml`). For ad-hoc overrides, see `docker compose` documentation.

### Access

- API: **http://localhost:3500**
- UI: **http://localhost:3501**

(Exact ports are listed in [docs/PORTS.md](../docs/PORTS.md).)

---

## Adding a New Script

When you add a script here, document it above with:

- **Purpose**: What the script does
- **Usage**: Command-line invocation with all flags
- **Inputs**: Required files or arguments
- **Outputs**: What files are produced
- **Dependencies**: System packages or Python packages required
- **Exit Codes**: Non-zero codes and their meanings
