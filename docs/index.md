# Finance Hub

> A personal finance command center — ingest every statement and receipt, unify all inflows and outflows, track goals, and project your financial future.

---

## What is Finance Hub?

Finance Hub is a self-hosted personal finance management system built around a single principle: **you should own your financial data and understand it completely.**

It ingests credit card statements, receipts, mortgage statements, tax documents, and other financial records. It normalizes everything into a single database, lets you query and categorize your spending and income, set financial goals, and model future scenarios.

---

## Phases at a Glance

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Ingest statements → DB → query & categorize | 🚧 In Design |
| **Phase 2** | Goals, budgets, unified financial view | 📋 Planned |
| **Phase 3** | Trends, projections, scenario modeling | 📋 Planned |
| **Phase 4** | Crypto portfolio tracking (wallets + Coinbase) | 📋 Planned |

---

## Phase 1 Capabilities

- Parse credit card CSV statements (multiple bank formats)
- Parse receipts (PDF and image via OCR)
- Normalize transactions into a unified schema
- Store in a local SQLite database (upgradeable to PostgreSQL)
- Query transactions by date, category, merchant, amount range
- Generate interactive HTML spending reports
- CLI-first interface for all operations

---

## Quick Links

- [Getting Started](GETTING_STARTED.md) — set up the environment and run your first ingest
- [System Overview](design/system-overview.md) — architecture and phased roadmap
- [Philosophy](design/philosophy.md) — generative development approach
- [Ingestion Service](design/services/ingestion-service/overview.md) — how statements get parsed and stored
- [Analysis Service](design/services/analysis-service/overview.md) — how to query and visualize your data
