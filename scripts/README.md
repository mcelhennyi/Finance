# Scripts

Utility scripts for the Finance Hub project. All scripts are parameterized and reusable.

---

## `serve-docs.sh` — Local MkDocs preview

Serves the site defined by root **`mkdocs.yml`** (port **8000** by default).

### Usage

```bash
./scripts/serve-docs.sh
# Custom port
./scripts/serve-docs.sh 9000
```

**Dependencies:** Python env with `mkdocs` and project theme/plugins installed (e.g. `pip install -r requirements.txt` and extras your `mkdocs.yml` needs).

**Exit codes:** `0` on clean run; non-zero if `mkdocs` fails to start.

---

## `dev.sh` — Development server

Starts the Finance Hub development server via Docker Compose with live reload.

### Usage

```bash
# Start dev server (builds image on first run)
./scripts/dev.sh

# Force-rebuild the image, then start
./scripts/dev.sh --build

# Wipe the dev database volume, then start (empty DB)
./scripts/dev.sh --fresh

# Ingest every CSV in data/seed-statements/ (additive), then start
./scripts/dev.sh --seed

# Wipe DB, re-import seed CSVs, then start (typical after schema/category logic changes)
./scripts/dev.sh --fresh --seed

# Attach to logs of an already-running server
./scripts/dev.sh --logs

# Stop the server
./scripts/dev.sh --stop

# Stop and destroy all containers + database volume (does not start)
./scripts/dev.sh --clean
```

Place statement CSVs in **`data/seed-statements/`** (contents are gitignored; only `.gitkeep` is tracked). You can also run **`PYTHONPATH=src python -m finance.dev_seed`** from the repo root against your local DB.

**Merchant display overrides** (pretty names from the Parameters page) are stored in **`data/seed-merchant-displays.json`** (tracked in git). After each successful Save or Clear in the UI, the API rewrites that file from the database so mappings survive `./scripts/dev.sh --fresh --seed`. Seeding applies that JSON after CSV ingest (or alone if there are no CSVs).

To dump the current DB overrides to the JSON file without running full seed:

```bash
PYTHONPATH=src python -m finance.dev_seed --export-merchant-displays
```

In Docker: `docker compose run --rm api python -m finance.dev_seed --export-merchant-displays`

Override the path with **`FINANCE_SEED_MERCHANT_DISPLAYS`** (see `docker-compose.yml`).

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

## `bbd_projection.py` — Buy, Borrow, Die projection (CLI)

**Purpose:** Runs the same multi-engine projection used by **`POST /api/bbd-projection/run`**: deterministic paths, terminal estate heuristic, CSV export, and optional Monte Carlo. Core logic lives under **`finance.bbd.engine`** (`src/finance/bbd/`); this script stays a thin TOML/CLI façade.

### Usage

```bash
# After editable install from repo root
pip install -e .
python scripts/bbd_projection.py config.toml
python scripts/bbd_projection.py config.toml --csv schedule.csv
python scripts/bbd_projection.py config.toml --montecarlo 500
python scripts/bbd_projection.py --emit-default starter.toml
```

### Inputs

- **TOML** file covering `[timing]`, `[income]`, `[taxes]`, `[expenses]`, `[savings]`, `[borrowing]`, `[strategy]`, `[[properties]]`, `[[private_equity]]` (see **`--emit-default`** output).

### Outputs

- **Stdout:** Human-readable summaries (deterministic schedule samples + terminal estate comparison + optional Monte Carlo stats).
- **`--csv PATH`:** Year-by-year numeric schedule.

### Dependencies

- **Python:** 3.11+ (stdlib **`tomllib`**).
- **`pip install -e .`** so `finance.bbd` is importable.

### Exit codes

- **0:** Success.
- **Non-zero:** argparse errors, missing config path, **`ValueError`** from unknown TOML keys.

### Related

- **Web UI:** Finance Hub navigation **BBD** (JSON scenario payload to **`/api/bbd-projection/run`**).

---

## Adding a New Script

When you add a script here, document it above with:

- **Purpose**: What the script does
- **Usage**: Command-line invocation with all flags
- **Inputs**: Required files or arguments
- **Outputs**: What files are produced
- **Dependencies**: System packages or Python packages required
- **Exit Codes**: Non-zero codes and their meanings
