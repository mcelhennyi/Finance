# FR-0001 — Design (level 0, skeleton)

## Purpose

Provide a contract-first design for Phase 2 capabilities that let users define goals/budgets and inspect a unified monthly view of inflows, outflows, liabilities, and budget variance.

## Actors

- End user (dashboard + API consumer)
- Goals service module
- Analysis service module
- Existing transaction and ingestion modules

## Public surfaces (skeleton)

Only contracts are listed here; implementation details are intentionally deferred to ticket execution.

| Surface | Kind | Contract (signature / schema sketch) | Owner (logical) |
|---------|------|----------------------------------------|-----------------|
| `POST /goals` | API route | Create goal: `{name, goal_type, target_amount, cadence, start_date, end_date?, category?}` | Goals service |
| `GET /goals` | API route | List goals with progress summary: `[{id, name, progress_pct, status, as_of}]` | Goals service |
| `POST /budgets` | API route | Create category budget: `{category, period_month, amount_limit}` | Goals service |
| `GET /budgets/variance` | API route | Return actual-vs-budget rows: `[{category, budget, actual, variance, trend_flag}]` | Goals + analysis services |
| `GET /cashflow/monthly` | API route | Return monthly inflow/outflow/liability deltas and net cash flow | Analysis service |
| `GET /unified-view/summary` | API route | Return top-level KPIs for dashboard card set | Dashboard adapter |
| `UnifiedViewPage` | UI contract | Dashboard sections: goals progress, budget variance, monthly cash flow, liability snapshot | Frontend dashboard |

## Data in / out

| Input | Output | Storage |
|-------|--------|---------|
| Transactions (existing), income entries, liability entries, budget definitions, goals | Goal progress, budget variance, unified monthly summary payloads | Existing DB + new Phase 2 goal/budget/income/liability tables |

## Design decisions (resolved)

- Liability ingestion in first cut includes manual/API entry, CSV import, and parser-plugin hooks for statement formats.
- Unified view scope in Phase 2 includes full net worth breakdown (assets, liabilities, and derived net).
- "Trending over budget" is both a derived inline indicator and persisted alert record history.
- Income and liability records support create, update, and soft delete operations.
- Reconciliation strictness is operational tolerance in VAL gates (target: monthly summary within USD 10 of component/source reconciliation totals).
