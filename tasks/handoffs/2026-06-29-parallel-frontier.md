# Next-step handoff - parallel frontier (2026-06-29)

**Audience:** Next agent or maintainer picking up FR-0006 expansion work.
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | `T-FR-0006-08` / `T-FR-0006-09` |
| **Active phase** | `TEST` |
| **Branch / worktree** | `feat/FR-0006-budget-cash-flow-graph`; child streams under `.worktrees/FR-0006-budget-cash-flow-graph/` |
| **Session status** | `developing` |
| **Next agent should** | Run medium-effort ticket agents for the two eligible expansion tickets, then merge back to `feat/FR-0006-budget-cash-flow-graph`. |

**Triad-complete (summary):** FR-0006 original tickets `T-FR-0006-01` through `T-FR-0006-07` are TEST / DEV / VAL `done`.

**Still incomplete (summary):** FR-0006 expansion tickets `T-FR-0006-08` through `T-FR-0006-11` remain incomplete.

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With `T-FR-0006-03` and `T-FR-0006-04` VAL-done, these tickets are eligible and mutually non-blocking:

| Ticket | Title | Deps |
|--------|-------|------|
| `T-FR-0006-08` | Unified source/sink allocation primitive contracts | `T-FR-0006-03` |
| `T-FR-0006-09` | Directional account handles and double-click linking | `T-FR-0006-04` |

So up to 2 parallel streams are dependency-valid:

- `feat/FR-0006-budget-cash-flow-graph/T-FR-0006-08-allocation-primitives` under `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-08-allocation-primitives/`
- `feat/FR-0006-budget-cash-flow-graph/T-FR-0006-09-directional-linking` under `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-09-directional-linking/`

**Examples of what stays blocked until more VAL-done rows exist:**

- `T-FR-0006-10` waits for `T-FR-0006-09` VAL-done.
- `T-FR-0006-11` waits for `T-FR-0006-08` and `T-FR-0006-10` VAL-done.

Full **Deps:** edges: scan all `tasks/feature-history/**/tickets.md`; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

This is a single-feature frontier batch inside `FR-0006`. Ticket agents should keep phase work serial within their own ticket and avoid editing the other ticket's owned files where possible. Do not run `/finish-feature` until all FR-0006 tickets through `T-FR-0006-11` are TEST / DEV / VAL `done`.

---

## Cross-cutting work (parallel to tickets)

- Keep `CURRENT.md` truthful on the feature branch and any ticket branches.
- Update only the owned ticket row in `tasks/ticket-progress.md` from each ticket stream.
- Preserve FR-0006 feature branches and ticket branches on the remote for audit.

---

## First concrete steps (primary next tickets)

1. Start **Unified source/sink allocation primitive contracts** (`T-FR-0006-08`) in its child worktree.
2. Start **Directional account handles and double-click linking** (`T-FR-0006-09`) in its child worktree.
3. Run each ticket through TEST -> DEV -> VAL with Docker / Compose validation where possible.
4. Refresh repo-root `CURRENT.md` on `feat/FR-0006-budget-cash-flow-graph` after the batch merges.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md`
