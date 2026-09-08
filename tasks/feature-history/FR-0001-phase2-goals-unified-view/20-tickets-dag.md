# FR-0001 — Work breakdown and DAG

Status colors: **green** means fully verified, **yellow** means work is underway,
and **red** means outstanding or waiting on earlier work. The feature integration
owner refreshes this graph before dispatch and after every wave.

## Canonical DAG

```mermaid
flowchart TB
  T01["Define goals and budgets data contracts (T-FR-0001-01)"]
  T02["Build goals and budget actuals engine (T-FR-0001-02)"]
  T03["Add income and liabilities ingestion contracts (T-FR-0001-03)"]
  T04["Expose unified monthly financial summary API (T-FR-0001-04)"]
  T05["Deliver Phase 2 unified dashboard view (T-FR-0001-05)"]

  T01 --> T02
  T01 --> T03
  T02 --> T04
  T03 --> T04
  T04 --> T05

  classDef completed fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px
  classDef inDevelopment fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px
  classDef outstanding fill:#fee2e2,stroke:#dc2626,color:#7f1d1d,stroke-width:2px
  class T01,T02,T03,T04,T05 completed
```

<!-- ticket-dag-status:start -->
**Where things stand:** Across the project, 35 of 48 defined tickets are fully verified; 13 remain open or are not yet recorded as complete. Phase2 goals unified view (FR-0001) is complete: all 5 tickets are fully verified.
<!-- ticket-dag-status:end -->

## Ticket table

| ID | Title (required - human-facing name) | Type | Needs first (title + stable ID) | Summary of change (1-2 lines) | Suggested order group | Link (optional) |
|----|----------------------------------------|------|---------------------|------------------------------|------------------------|-----------------|
| T-FR-0001-01 | Define goals and budgets data contracts | Story | Nothing — can start immediately | Add API schemas, persistence model contracts, and validation boundaries for goals/budgets. | P0 foundation | [details](tickets.md#t-fr-0001-01---define-goals-and-budgets-data-contracts) |
| T-FR-0001-02 | Build goals and budget actuals engine | Story | Define goals and budgets data contracts (T-FR-0001-01) | Implement actual-vs-budget and goal progress calculations using existing transaction data. | P1 | [details](tickets.md#t-fr-0001-02---build-goals-and-budget-actuals-engine) |
| T-FR-0001-03 | Add income and liabilities ingestion contracts | Story | Define goals and budgets data contracts (T-FR-0001-01) | Introduce manual/API + CSV + parser-plugin ingestion contracts with create/update/soft-delete lifecycle support. | P1 | [details](tickets.md#t-fr-0001-03---add-income-and-liabilities-ingestion-contracts) |
| T-FR-0001-04 | Expose unified monthly financial summary API | Story | Build goals and budget actuals engine (T-FR-0001-02); Add income and liabilities ingestion contracts (T-FR-0001-03) | Add endpoint combining inflow/outflow/liability, budget status, and full net worth breakdown with USD 10 reconciliation tolerance in VAL. | P2 | [details](tickets.md#t-fr-0001-04---expose-unified-monthly-financial-summary-api) |
| T-FR-0001-05 | Deliver Phase 2 unified dashboard view | Story | Expose unified monthly financial summary API (T-FR-0001-04) | Implement frontend unified view for goals, variance, cash flow, net worth, and both derived + persisted over-budget alerts. | P3 | [details](tickets.md#t-fr-0001-05---deliver-phase-2-unified-dashboard-view) |

**Parallelization rule:** Tickets with disjoint transitive ownership and all deps VAL-done can run in parallel.


## Map to feature `tickets.md` + global index

- Canonical `### T-FR-0001-xx` sections live in `tasks/feature-history/FR-0001-phase2-goals-unified-view/tickets.md`.
- Added this feature path to `tasks/feature-history/TICKET-SOURCES.md`.
- Added this feature row and graph edges to `docs/design/tickets-initial.md`.
- Added ticket rows to `tasks/ticket-progress.md`.

## Suggested `identify-frontier` check

Run `/identify-frontier` after this design handoff to validate the initial parallel-capable set.

## Decision alignment notes

- Ingestion scope includes manual/API entry, CSV, and parser-plugin hooks for liability and income records.
- Unified view includes full net worth breakdown in addition to cash flow and liability indicators.
- Over-budget behavior includes both derived indicators and persisted alert history.
- Reconciliation remains operational (USD 10 tolerance) for VAL, not strict accounting lockstep.
