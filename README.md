<p align="center">
  <img src="docs/assets/logo.png" alt="Finance Hub logo" width="128" height="128" />
</p>

# Finance Hub

**Self-hosted personal finance:** ingest statements and receipts, normalize everything into one datastore, explore spending and income, and (as the roadmap matures) tie it to goals, budgets, and projections—without handing your ledger to a third-party SaaS.

Finance Hub is aimed at people who want **ownership of their data**, a **clear audit trail** from raw files to categorized transactions, and a path from today’s balances to **future scenarios**. The stack pairs a Python/FastAPI backend with a React dashboard, SQLite (upgradeable to PostgreSQL), and documentation-first design so the system can evolve deliberately.

## Why this project exists

- **Privacy and control** — Your statements stay on infrastructure you run.
- **Unified model** — Multiple banks and formats normalize into one transaction schema.
- **CLI and API first** — Automate ingests and queries; the UI builds on the same contracts.
- **Documented architecture** — Behavior and boundaries are spelled out in `docs/design/` so contributors can align with intent.

## Features

### Current

These capabilities are available today (exact coverage evolves with Phase 1 work; see [docs/index.md](docs/index.md) for the formal phase table).

- **Statement ingestion** — Upload or import credit card and bank activity (CSV and related formats), normalize into a single transaction model, and persist to a local **SQLite** database (PostgreSQL is intended as an upgrade path).
- **REST API** — FastAPI service for ingestion, listing transactions, aggregates/metrics, filter metadata, sources, and merchant display names (used by the UI and easy to script against).
- **Web dashboard** — React/Vite app to explore transactions, filters, and summary metrics, with file upload for ingests.
- **Query & reporting (CLI and static reports)** — Command-line access to transactions and summaries; optional **HTML spending reports** for offline review.
- **Developer workflow** — Docker-based dev stack (`scripts/dev.sh`), seed data support, and design docs under `docs/design/`.

### Planned

Roadmap by phase (detailed in [System overview](docs/design/system-overview.md) and service design docs):

- **Phase 2 — Goals and unified view** — Financial goals, budgets, and a single pane that combines income, expenses, and liabilities.
- **Phase 3 — Analysis and projections** — Stronger trends over time, forward-looking projections, and scenario modeling (“what if”) on top of the same ledger.
- **Phase 4 — Crypto portfolio** — Optional tracking for wallets and exchange accounts (e.g. Coinbase) alongside traditional cash and card flows.

## Quick start

The fastest path for local development is Docker:

```bash
./scripts/dev.sh
```

This brings up the API and web UI (see [docs/PORTS.md](docs/PORTS.md) for defaults). For a full native setup, database initialization, and first ingest, follow **[Getting Started](docs/GETTING_STARTED.md)**.

## Repository layout

- `src/` — Python package (`finance`, API, ingestion, queries)
- `frontend/` — Vite + React dashboard
- `docs/` — MkDocs site (design, guides, port registry)
- `scripts/` — Development and automation helpers

## Documentation

- **User and operator guides:** `docs/` (build locally with `mkdocs serve` from the project root if you have dev dependencies installed)
- **Architecture and services:** `docs/design/`

## Contributing

Issues and pull requests are welcome. Please read the design notes for the area you’re changing so behavior stays consistent with the documented model. Tests and type checks are part of the usual workflow (`pytest`, `mypy`—see `pyproject.toml` and CI if present).

## Acknowledgments

Built as an open, extensible finance hub—not a replacement for professional tax or investment advice.
