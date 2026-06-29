# Feature request registry (`FR-NNNN`)

**Rules:** Four-digit zero-padded ids. **Never** reuse an **`FR-NNNN`** for a different feature. Increment **`next_id`** when allocating a new number.

**Parallel features:** Multiple rows may be **`design`** or **`in-progress`** at the same time. Each row points at a **distinct** directory **`tasks/feature-history/FR-NNNN-<slug>/`**.

| FR id | Slug (directory) | Status | Tickets (when known) | Notes |
|-------|------------------|--------|------------------------|-------|
| FR-0000 | `FR-0000-bootstrap/` | `complete` | **`T-FR-0000-01`** in [`FR-0000-bootstrap/tickets.md`](FR-0000-bootstrap/tickets.md) | Core / repo bootstrap completed manually. |
| FR-0001 | `FR-0001-phase2-goals-unified-view/` | `complete` | **`T-FR-0001-01`** through **`T-FR-0001-05`** in [`FR-0001-phase2-goals-unified-view/tickets.md`](FR-0001-phase2-goals-unified-view/tickets.md) | Merged to default branch (PR #5, 2026-04-27). |
| FR-0002 | `FR-0002-budget-entry-page/` | `complete` | **`T-FR-0002-01`** through **`T-FR-0002-05`** in [`FR-0002-budget-entry-page/tickets.md`](FR-0002-budget-entry-page/tickets.md) | Allocation contracts, API, unified budget sync, **`BudgetPage`**, operator docs + closeout; spreadsheet import deferred. |
| FR-0003 | `FR-0003-bbd-projection-ui/` | `complete` | **`T-FR-0003-01`** through **`T-FR-0003-04`** in [`FR-0003-bbd-projection-ui/tickets.md`](FR-0003-bbd-projection-ui/tickets.md) | `finance.bbd.engine`, `POST /api/bbd-projection/run`, **BBD** SPA page; CLI **`scripts/bbd-projection/`** (`README.md`, `example-scenario.toml`, `bbd_projection.py`). |
| FR-0004 | `FR-0004-bbd-projection-experience/` | `complete` | **`T-FR-0004-01`** through **`T-FR-0004-05`** in [`FR-0004-bbd-projection-experience/tickets.md`](FR-0004-bbd-projection-experience/tickets.md) | Merged to default branch (PR [#7](https://github.com/mcelhennyi/Finance/pull/7), 2026-05-10): immersive BBD UI — dock, **`bbdVizModel`**, story dashboard, lazy **`three`** spatial view, **`scripts/bbd-projection/`**. |
| FR-0005 | `FR-0005-budget-page-docs-dock/` | `complete` | **`T-FR-0005-01`** in [`FR-0005-budget-page-docs-dock/tickets.md`](FR-0005-budget-page-docs-dock/tickets.md) | Budget **`BudgetGuideContent`** modal (parity with BBD docs), **`budgetFieldTips`** + hover labels, floating dock (month, cutoff, jumps, save). |
| FR-0006 | `FR-0006-budget-cash-flow-graph/` | `complete` | **`T-FR-0006-01`** through **`T-FR-0006-11`** in [`FR-0006-budget-cash-flow-graph/tickets.md`](FR-0006-budget-cash-flow-graph/tickets.md) | Feature-complete closeout drafted 2026-06-29; PR [#9](https://github.com/mcelhennyi/Finance/pull/9) pending human review. Persisted **`CashNode`/`CashFlowEdge`**, CRUD API, Budget **React Flow** panel, time scrub, BBD edge suggestions, Compose default review; expansion adds explicit source/sink allocation primitives, account endpoints, direct linking, orthogonal routing, and expandable allocation clusters. |

**next_id:** `7`

**Allocating a new `FR-NNNN`:** Create directory **`tasks/feature-history/FR-NNNN-<slug>/`**, add a row to the table, set **`next_id`** to **NNNN+1**, and add the ticket file path to **`TICKET-SOURCES.md`**.
