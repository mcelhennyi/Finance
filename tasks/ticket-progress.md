# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | `T-FR-0001-02`, `T-FR-0001-03` |
| **Active phase** | `TEST` |
| **Branch / worktree** | `feat/FR-0001-phase2-goals-unified-view` + child worktrees for `T-FR-0001-02` and `T-FR-0001-03` |
| **Session status** | `planning` |
| **Next agent should** | Start the next frontier pair in parallel: **Build goals and budget actuals engine** (`T-FR-0001-02`) and **Add income and liabilities ingestion contracts** (`T-FR-0001-03`), then progress TEST → DEV → VAL. |

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
| T-FR-0001-02 | Build goals and budget actuals engine | — | — | — | `FR-0001` |
| T-FR-0001-03 | Add income and liabilities ingestion contracts | — | — | — | `FR-0001` |
| T-FR-0001-04 | Expose unified monthly financial summary API | — | — | — | `FR-0001` |
| T-FR-0001-05 | Deliver Phase 2 unified dashboard view | — | — | — | `FR-0001` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
