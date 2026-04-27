# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | `—` (FR-0001 Phase 2 view queue complete) |
| **Active phase** | `VAL` (verify in Docker) |
| **Branch / worktree** | `feat/FR-0001-phase2-goals-unified-view` |
| **Session status** | `ready` |
| **Next agent should** | VAL `T-FR-0001-05` end-to-end (compose + `npm test` in `frontend/`), then merge/PR or plan next feature. |

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

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
