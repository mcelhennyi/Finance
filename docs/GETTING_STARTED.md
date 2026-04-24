# Getting Started

This guide walks you through setting up Finance Hub and running your first statement ingest.

## Prerequisites

- Python 3.11 or later
- `uv` (recommended) or `pip`

## Installation

### 1. Clone and enter the project

```bash
git clone git@github.com:mcelhennyi/Finance.git
cd Finance
```

### 2. Create a virtual environment and install dependencies

Using `uv` (recommended):

```bash
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

Using pip:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 3. Initialize the database

```bash
finance db init
```

This creates a local SQLite database at `~/.finance/finance.db` by default. The path is configurable via the `FINANCE_DB_URL` environment variable.

## Ingesting Your First Statement

### Credit Card CSV (Phase 1)

Export your credit card statement as a CSV from your bank's website, then run:

```bash
finance ingest statement --file ~/Downloads/activity.csv --source chase
```

Supported `--source` values in Phase 1:

- `chase` — Chase credit card activity export
- `generic` — Auto-detect column format

### View Transactions

```bash
# Show all transactions
finance query transactions

# Filter by date range
finance query transactions --from 2025-01-01 --to 2025-03-31

# Filter by category
finance query transactions --category "Dining"

# Show spending summary by category
finance query summary --group-by category
```

### Generate a Report

```bash
finance report spending --output spending_report.html
open spending_report.html
```

## Running Tests

```bash
pytest -v
pytest -v -m unit       # fast unit tests only
pytest -v -m integration  # integration tests (requires DB)
```

## Building the Documentation

```bash
mkdocs serve
```

Then open [http://localhost:8000](http://localhost:8000).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FINANCE_DB_URL` | `~/.finance/finance.db` | SQLite or PostgreSQL connection URL |
| `FINANCE_DATA_DIR` | `~/.finance/` | Directory for raw statement storage |
| `FINANCE_LOG_LEVEL` | `INFO` | Logging verbosity |
