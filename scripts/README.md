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

**Merchant display overrides** (pretty names edited under **Settings → Transactions → Merchant display** in the SPA) are stored in **`data/seed-merchant-displays.json`** (tracked in git). After each successful Save or Clear in the UI, the API rewrites that file from the database so mappings survive `./scripts/dev.sh --fresh --seed`. Seeding applies that JSON after CSV ingest (or alone if there are no CSVs).

To dump the current DB overrides to the JSON file without running full seed:

```bash
PYTHONPATH=src python -m finance.dev_seed --export-merchant-displays
```

In Docker: `docker compose run --rm api python -m finance.dev_seed --export-merchant-displays`

Override the path with **`FINANCE_SEED_MERCHANT_DISPLAYS`** (see `docker-compose.yml`).

**Budget default allocation:** the repo ships **`data/budget-default-plan.yaml`** — a purpose-built document matching Budget page fields (`plan` header + `items` with `planned_amount`, `cadence`, `payment_method`, optional `due_day` / `notes`). **`python -m finance.dev_seed`** loads it after CSV ingest (same command as **`./scripts/dev.sh --seed`**). Compose sets **`FINANCE_BUDGET_DEFAULT_YAML`** to **`/app/data/budget-default-plan.yaml`**.

Point **`FINANCE_BUDGET_DEFAULT_YAML`** at another file to customize. **`FINANCE_BUDGET_ALLOCATION_PERIOD_MONTH`** (ISO date) sets the planning month when **`period_month`** is omitted from the YAML. **`FINANCE_BUDGET_DEFAULT_SEED_ENABLED=false`** skips applying the YAML.

To sync DB-backed seed values back to disk after editing them in the UI:

```bash
./develop seed-sync
```

This refreshes **`data/seed-merchant-displays.json`** and exports the matching Budget plan back to **`data/budget-default-plan.yaml`**. By default, the budget export selects the plan named in the current YAML for that YAML's **`period_month`**. If you renamed the plan in the UI or want a specific plan, pass its id:

```bash
./develop seed-sync --plan-id 12
```

### What it does

1. Builds and starts the **api** and **web** services from `docker-compose.yml` (FastAPI + Vite, with reload)
2. Persists SQLite in a named Docker volume (`finance-db`)

Host ports are defined in **[docs/PORTS.md](../docs/PORTS.md)**.

### Environment variables

Compose sets service env vars (see `docker-compose.yml`). For ad-hoc overrides, see `docker compose` documentation.


- **`FINANCE_BUDGET_DEFAULT_YAML`** — path to the budget allocation seed document (repo default **`data/budget-default-plan.yaml`**; Compose **`/app/data/budget-default-plan.yaml`**).
- **`FINANCE_ALLOCATION_AUTO_TEMPLATE`** — when `true` / `1` / `yes`, the first **`GET /api/budget-allocation/plans?month=…`** for a month with no plans inserts **Starter cash-flow template** (illustrative lines). Repo **`docker-compose.yml`** defaults to **`false`** (empty month until the user creates a plan); set **`true`** locally when you want the demo seed. See **`docs/design/budget-plans-roadmap.md`**.

### Access

- API: **http://localhost:3500**
- UI: **http://localhost:3501**

(Exact ports are listed in [docs/PORTS.md](../docs/PORTS.md).)

---

## `check-frontend-no-merge-markers.sh` — Block broken SPA builds

Scans **`frontend/src`** for unresolved git merge markers (`<<<<<<<`, `>>>>>>>`). Those strings break Vite’s TSX parser and typically produce a **blank white page** at **http://localhost:3501** until they are removed.

### Usage

```bash
./scripts/check-frontend-no-merge-markers.sh
```

### Dependencies

- **bash**, **grep** (POSIX; available on macOS and in most Linux images)

### Exit codes

- **0** — no markers found
- **1** — at least one marker line found (see stderr for paths)
- **2** — `frontend/src` missing (unexpected layout)

### What it does

Recursively greps `*.ts`, `*.tsx`, `*.js`, and `*.jsx` under **`frontend/src`** for lines starting with **`<<<<<<<`** or **`>>>>>>>`**, then prints matches and exits non-zero if any exist.

---

## `bbd-projection/` — Buy, Borrow, Die projection (CLI bundle)

Standalone TOML-driven projection (**`scripts/bbd-projection/bbd_projection.py`**), **`example-scenario.toml`** (committed teaching numbers), and **`README.md`** (CLI cookbook plus **Strategy appendix** for framing and output semantics).

See **[`bbd-projection/README.md`](bbd-projection/README.md)** for the tutorial, CLI flags, TOML map, CSV/stdout semantics, Hub versus CLI tradeoffs.

The SPA **BBD** page (app nav **BBD**) calls the same engine through the Hub API: **`recharts`** story charts (trajectory, composition, borrowing vs LTV), an optional **three.js** spatial trajectory you can expand below the charts (hidden when the OS requests reduced motion), CSV/JSON export from the bottom control bar, and the narrative guide via **Docs**.

---

## Budget allocation validation (FR-0002)

Use these checks before merging or when validating the **Budget** page and **`/api/budget-allocation/*`** stack.

**Backend (API image, repo mounted at `/app`):**

```bash
docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/ -q"
```

**Frontend (web dev image, `frontend/` mounted at `/app`):**

```bash
docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"
```

**Manual smoke:** start **`./scripts/dev.sh`**, open **Budget**, create a plan and allocation lines, confirm **Unified view** shows matching category budget after save. For the FR-0006 cash-flow map, inspect desktop and phone viewports: account counts, source/sink allocation endpoints, expand/collapse, filters, mini-node text fit, and graph relayout / routing with no console errors.

---

## Adding a New Script

**Subfolder bundles:** When a tool ships with long-form docs beside the entrypoint (see **`bbd-projection/`**), keep **`README.md`**, example inputs, optional **gitignored** personal configs (`ian.toml`), and the script **together** and link from this index.

When you add a script here, document it above with:

- **Purpose**: What the script does
- **Usage**: Command-line invocation with all flags
- **Inputs**: Required files or arguments
- **Outputs**: What files are produced
- **Dependencies**: System packages or Python packages required
- **Exit Codes**: Non-zero codes and their meanings
