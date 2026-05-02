# Feature request registry (`FR-NNNN`)

**Rules:** Four-digit zero-padded ids. **Never** reuse an **`FR-NNNN`** for a different feature. Increment **`next_id`** when allocating a new number.

**Parallel features:** Multiple rows may be **`design`** or **`in-progress`** at the same time. Each row points at a **distinct** directory **`tasks/feature-history/FR-NNNN-<slug>/`**.

| FR id | Slug (directory) | Status | Tickets (when known) | Notes |
|-------|------------------|--------|------------------------|-------|
| FR-0000 | `FR-0000-bootstrap/` | `complete` | **`T-FR-0000-01`** in [`FR-0000-bootstrap/tickets.md`](FR-0000-bootstrap/tickets.md) | Core / repo bootstrap completed manually. |
| FR-0001 | `FR-0001-phase2-goals-unified-view/` | `complete` | **`T-FR-0001-01`** through **`T-FR-0001-05`** in [`FR-0001-phase2-goals-unified-view/tickets.md`](FR-0001-phase2-goals-unified-view/tickets.md) | Merged to default branch (PR #5, 2026-04-27). |
| FR-0002 | `FR-0002-budget-entry-page/` | `design` | Proposed **`T-FR-0002-01`** through **`T-FR-0002-05`** in [`FR-0002-budget-entry-page/tickets.md`](FR-0002-budget-entry-page/tickets.md) | Manual budget allocation entry page; sample spreadsheet informs content requirements only. |
| FR-0003 | `FR-0003-bbd-projection-ui/` | `complete` | **`T-FR-0003-01`** through **`T-FR-0003-04`** in [`FR-0003-bbd-projection-ui/tickets.md`](FR-0003-bbd-projection-ui/tickets.md) | `finance.bbd.engine`, `POST /api/bbd-projection/run`, **BBD** SPA page; CLI `scripts/bbd_projection.py`. |

**next_id:** `4`

**Allocating a new `FR-NNNN`:** Create directory **`tasks/feature-history/FR-NNNN-<slug>/`**, add a row to the table, set **`next_id`** to **NNNN+1**, and add the ticket file path to **`TICKET-SOURCES.md`**.
