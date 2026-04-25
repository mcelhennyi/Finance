# Next-step handoff — parallel frontier (2026-04-25-b)

**Audience:** Next agent or maintainer picking up work from `feat/FR-0001-phase2-goals-unified-view`.  
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | `T-FR-0001-02`, `T-FR-0001-03` |
| **Active phase** | `TEST` |
| **Branch / worktree** | `feat/FR-0001-phase2-goals-unified-view` + child worktrees for `T-FR-0001-02` and `T-FR-0001-03` |
| **Session status** | `planning` |
| **Next agent should** | Start the next frontier pair in parallel: `T-FR-0001-02` and `T-FR-0001-03`, then progress TEST → DEV → VAL. |

**Triad-complete (summary):** `T-FR-0000-01`, `T-FR-0001-01`.

**Still incomplete (summary):** `T-FR-0001-02`, `T-FR-0001-03`, `T-FR-0001-04`, `T-FR-0001-05`.

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With `T-FR-0001-01` now VAL-done, these tickets are eligible and mutually non-blocking:

| Ticket | Title | Deps |
|--------|-------|------|
| `T-FR-0001-02` | Build goals and budget actuals engine | `T-FR-0001-01` |
| `T-FR-0001-03` | Add income and liabilities ingestion contracts | `T-FR-0001-01` |

So **up to 2 parallel streams** are dependency-valid under `.worktrees/FR-0001-phase2-goals-unified-view/...`.

**Examples of what stays blocked until more VAL-done rows exist:**

- `T-FR-0001-04` blocked on `T-FR-0001-02` and `T-FR-0001-03` VAL.
- `T-FR-0001-05` blocked on `T-FR-0001-04` VAL.

Full **Deps:** edges: scan all `tasks/feature-history/**/tickets.md`; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

The queue and graph are aligned: both point to a two-stream frontier (`T-FR-0001-02` + `T-FR-0001-03`) before the next serialization point at `T-FR-0001-04`.

---

## Cross-cutting work (parallel to tickets)

- Keep `tasks/ticket-progress.md` updates isolated to each ticket row.
- Keep `CURRENT.md` refreshed on each ticket branch and on the feature branch after merges.
- Keep `docs/design/tickets-initial.md` `triadDone` unioned as tickets reach VAL-done.

---

## First concrete steps (primary next tickets)

1. Create ticket branch/worktree for `T-FR-0001-02`; execute TEST → DEV → VAL.
2. Create ticket branch/worktree for `T-FR-0001-03`; execute TEST → DEV → VAL.
3. Use Docker/Compose/Dev Container commands where possible for validation; note host-local exceptions in diary/handoff.
4. Merge both ticket branches into `feat/FR-0001-phase2-goals-unified-view`, revalidate, then proceed toward `T-FR-0001-04`.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/FR-0001-phase2-goals-unified-view/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md`
