# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | — |
| **Active phase** | — |
| **Branch / worktree** | — |
| **Session status** | `starting` |
| **Next agent should** | Read `docs/ai-context.md`, `README.md`, and `docs/design/architecture/overview.md`. Pick the smallest eligible ticket per **Deps:** in the owning `tickets.md` file. |

### Parallel streams (optional)

Use when **more than one** ticket id or **`FR-NNNN`** is actively developed in parallel. Each stream: own `.worktrees/FR-NNNN-<slug>/...` worktree and feature-prefixed branch; update **only** your **Progress** row for your ticket.

| Stream label | Ticket(s) | `FR-NNNN` (if any) | Branch / worktree | Owner / note |
|----------------|------------|--------------------|-------------------|--------------|
| *(none — single stream)* | — | — | — | — |

---

## Progress

| Ticket | Title | TEST | DEV | VAL | Notes |
|--------|-------|------|-----|-----|-------|
| T-FR-0000-01 | Choose stack and scaffold repository | — | — | — | `FR-0000` |
| T-FR-0001-01 | Define goals and budgets data contracts | done | done | done | `FR-0001` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
