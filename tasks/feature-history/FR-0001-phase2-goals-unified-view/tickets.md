# Tickets — FR-0001 phase2-goals-unified-view

**Feature id:** **`FR-0001`**  
**Canonical ids:** **`T-FR-0001-xx`**

---

### T-FR-0001-01 — Define goals and budgets data contracts

**Title:** Define goals and budgets data contracts  
**Deps:** `none`

#### Purpose

Define schemas and persistence contracts for goals and category budgets so downstream services can compute progress and variance consistently.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Lock API and schema acceptance | Contract tests/spec examples cover create/list flows and required fields |
| **DEV** | Implement contract layer | API schemas and DB model/migration stubs compile and pass unit tests |
| **VAL** | Verify compatibility | Existing Phase 1 ingestion/query behavior remains green; new contract tests pass |

#### Notes

- Keep naming aligned with `docs/design/services/goals-service/overview.md`.

---

### T-FR-0001-02 — Build goals and budget actuals engine

**Title:** Build goals and budget actuals engine  
**Deps:** `T-FR-0001-01`

#### Purpose

Compute goal progress and budget variance from normalized transactions and expose deterministic service methods for API use.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Define calculation correctness | Tests cover positive/negative variance, monthly boundaries, and incomplete-month trend flags |
| **DEV** | Implement engine | Service methods calculate actual-vs-budget and goal progress using existing analysis data access |
| **VAL** | Verify on seeded data | Results reconcile against seeded statement totals for at least one month |

#### Notes

- Include a clear treatment for credits/refunds to avoid double counting.

---

### T-FR-0001-03 — Add income and liabilities ingestion contracts

**Title:** Add income and liabilities ingestion contracts  
**Deps:** `T-FR-0001-01`

#### Purpose

Introduce contract surfaces for income and liability records so unified reporting can include non-card inflows and debt obligations.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Define accepted record formats | Contract tests/spec fixtures for income and liability ingest payloads |
| **DEV** | Implement ingestion contract path | Manual/API entry, CSV ingest, parser-plugin hooks, and persistence paths are wired for income/liability records |
| **VAL** | Verify normalized outputs | Seeded examples ingest successfully and appear in aggregate queries |

#### Notes

- CRUD scope for income/liability records in Phase 2 is create + update + soft delete.

---

### T-FR-0001-04 — Expose unified monthly financial summary API

**Title:** Expose unified monthly financial summary API  
**Deps:** `T-FR-0001-02`, `T-FR-0001-03`

#### Purpose

Expose a single API response shape combining goals/budgets variance, monthly inflow/outflow, liabilities, and full net worth breakdown.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Freeze response contract | API tests define summary fields and error behavior |
| **DEV** | Implement endpoint + aggregation adapter | Route/service returns unified summary for requested month/range |
| **VAL** | Verify reconciliation | Sample month summary reconciles to component/source totals within USD 10 operational tolerance |

#### Notes

- Keep endpoint shape stable for dashboard consumption.

---

### T-FR-0001-05 — Deliver Phase 2 unified dashboard view

**Title:** Deliver Phase 2 unified dashboard view  
**Deps:** `T-FR-0001-04`

#### Purpose

Build the UI surface that presents goals progress, budget variance, monthly cash flow, alerts, and net worth breakdown in one dashboard experience.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Define UX acceptance | Component/API contract tests cover loading, empty, and error states |
| **DEV** | Implement unified page/cards | Frontend view consumes summary endpoint and renders core KPI cards + tables |
| **VAL** | Validate end-to-end behavior | Manual or automated UI checks confirm values match API responses |

#### Notes

- Keep implementation incremental so MVP can ship without advanced charting.
- Display both derived trend indicators and persisted alert history for over-budget states.
