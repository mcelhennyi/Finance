# Next-step handoff — parallel frontier (2026-04-25)

**Audience:** Next agent or maintainer picking up work from `main`.  
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | — |
| **Active phase** | — |
| **Branch / worktree** | — |
| **Session status** | `starting` |
| **Next agent should** | Read `docs/ai-context.md`, `README.md`, and `docs/design/architecture/overview.md`. Pick the smallest eligible ticket per **Deps:** in the owning `tickets.md` file. |

**Triad-complete (summary):** `T-FR-0000-01` (manually completed).

**Still incomplete (summary):** `T-FR-0001-01`, `T-FR-0001-02`, `T-FR-0001-03`, `T-FR-0001-04`, `T-FR-0001-05`.

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With `T-FR-0000-01` already triad-complete and no other VAL-done dependencies yet, these tickets are eligible and mutually non-blocking:

| Ticket | Title | Deps |
|--------|-------|------|
| `T-FR-0001-01` | Define goals and budgets data contracts | `none` |

So **up to 1 parallel stream** is dependency-valid right now: `feat/FR-NNNN-<slug>/T-FR-NNNN-xx-...` under `.worktrees/FR-NNNN-<slug>/...`.

**Examples of what stays blocked until more VAL-done rows exist:**

- `T-FR-0001-02` (Build goals and budget actuals engine) blocked on `T-FR-0001-01` VAL.
- `T-FR-0001-03` (Add income and liabilities ingestion contracts) blocked on `T-FR-0001-01` VAL.
- `T-FR-0001-04` (Expose unified monthly financial summary API) blocked on `T-FR-0001-02` and `T-FR-0001-03` VAL.
- `T-FR-0001-05` (Deliver Phase 2 unified dashboard view) blocked on `T-FR-0001-04` VAL.

Full **Deps:** edges: scan all `tasks/feature-history/**/tickets.md`; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

The queue beacon is still empty (`starting`) but FR-0000 bootstrap is already closed manually, so the graph now has a single clear entry point: `T-FR-0001-01`.

---

## Cross-cutting work (parallel to tickets)

- Keep `tasks/ticket-progress.md` current per ticket owner (only update your row during parallel execution).
- When implementation branches are created, keep branch-local `CURRENT.md` updated on each `feat/FR-NNNN-<slug>` and ticket branch.
- Keep global DAG status (`triadDone` classes in `docs/design/tickets-initial.md`) synchronized as tickets reach full TEST/DEV/VAL completion.

---

## First concrete steps (primary next ticket)

1. Start feature branch and worktree for `FR-0001` (`feat/FR-0001-phase2-goals-unified-view` under `.worktrees/FR-0001-phase2-goals-unified-view/feature/`).
2. Begin **Define goals and budgets data contracts** (`T-FR-0001-01`) in a ticket branch/worktree and execute TEST → DEV → VAL.
3. Update `tasks/ticket-progress.md` Current focus + the `T-FR-0001-01` row as phases advance.
4. If `feat/*` implementation branches are in scope, refresh repo-root `CURRENT.md` on each affected `feat/FR-NNNN-<slug>` so the parallel set and next actions match this handoff.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/**/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md` (global DAG + triadDone)
