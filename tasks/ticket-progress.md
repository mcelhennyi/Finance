# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | `—` (no active ticket; allocate next **`FR-NNNN`** when starting new product work) |
| **Active phase** | `idle` |
| **Branch / worktree** | default branch (`master` / team convention); last shipped: **FR-0001** (PR #5 merged) |
| **Session status** | `planning` |
| **Next agent should** | For **FR-0002 budget entry page**, run `/identify-frontier` and then `/develop-frontier` if implementation should begin; the first eligible ticket is **Define budget allocation contracts** (`T-FR-0002-01`). |

### Parallel streams (optional)

Use when **more than one** ticket id or **`FR-NNNN`** is actively developed in parallel. Each stream: own `.worktrees/FR-NNNN-<slug>/...` worktree and feature-prefixed branch; update **only** your **Progress** row for your ticket.

| Stream label | Ticket(s) | `FR-NNNN` (if any) | Branch / worktree | Owner / note |
|----------------|------------|--------------------|-------------------|--------------|
| *(none — single stream)* | — | — | — | — |

---

## Progress

| Ticket | Title | TEST | DEV | VAL | Notes |
|--------|-------|------|-----|-----|-------|
| T-FR-0000-01 | Choose stack and scaffold repository | done | done | done | `FR-0000` (manually completed outside ticket workflow) |
| T-FR-0001-01 | Define goals and budgets data contracts | done | done | done | `FR-0001` |
| T-FR-0001-02 | Build goals and budget actuals engine | done | done | done | `FR-0001` (Dockerized test/validation; seeded-month reconciliation covered by integration fixture) |
| T-FR-0001-03 | Add income and liabilities ingestion contracts | done | done | done | `FR-0001` (Dockerized test/validation; seeded CSV ingest + aggregate verification complete) |
| T-FR-0001-04 | Expose unified monthly financial summary API | done | done | done | `FR-0001` (GET `/api/unified-view/summary`; `finance.unified.monthly`; tests + USD 10 reconciliation block) |
| T-FR-0001-05 | Deliver Phase 2 unified dashboard view | done | done | done | `FR-0001` (Unified view page, vitest: alerts + month + contract shape) |
| T-FR-0002-01 | Define budget allocation contracts | todo | todo | todo | `FR-0002`; first eligible implementation ticket; depends on completed `T-FR-0001-05` |
| T-FR-0002-02 | Expose budget allocation API | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-01` |
| T-FR-0002-03 | Sync allocation totals into unified budgets | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-02` |
| T-FR-0002-04 | Deliver budget entry page | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-02` |
| T-FR-0002-05 | Validate and document budget entry workflow | todo | todo | todo | `FR-0002`; depends on `T-FR-0002-03` and `T-FR-0002-04` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
