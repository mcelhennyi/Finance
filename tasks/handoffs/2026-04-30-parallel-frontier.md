# Next-step handoff — parallel frontier (2026-04-30)

**Audience:** Next agent or maintainer picking up work from `master`.
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | `—` (no active ticket; allocate next **`FR-NNNN`** when starting new product work) |
| **Active phase** | `idle` |
| **Branch / worktree** | default branch (`master` / team convention); last shipped: **FR-0001** (PR #5 merged) |
| **Session status** | `planning` |
| **Next agent should** | For **FR-0002 budget entry page**, run `/identify-frontier` and then `/develop-frontier` if implementation should begin; the first eligible ticket is **Define budget allocation contracts** (`T-FR-0002-01`). |

**Triad-complete (summary):** `T-FR-0000-01`, `T-FR-0001-01`, `T-FR-0001-02`, `T-FR-0001-03`, `T-FR-0001-04`, and `T-FR-0001-05` are TEST/DEV/VAL done.

**Still incomplete (summary):** `T-FR-0002-01` through `T-FR-0002-05` are all todo.

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With `T-FR-0001-05` VAL-done, this ticket is eligible and incomplete:

| Ticket | Title | Deps |
|--------|-------|------|
| `T-FR-0002-01` | Define budget allocation contracts | `T-FR-0001-05` |

So **up to 1 parallel stream** is dependency-valid: `feat/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts` under `.worktrees/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts/`.

**Examples of what stays blocked until more VAL-done rows exist:**

- **Expose budget allocation API** (`T-FR-0002-02`) is blocked until `T-FR-0002-01` is VAL-done.
- **Sync allocation totals into unified budgets** (`T-FR-0002-03`) is blocked until `T-FR-0002-02` is VAL-done.
- **Deliver budget entry page** (`T-FR-0002-04`) is blocked until `T-FR-0002-02` is VAL-done.
- **Validate and document budget entry workflow** (`T-FR-0002-05`) is blocked until both `T-FR-0002-03` and `T-FR-0002-04` are VAL-done.

Full **Deps:** edges: scan all **`tasks/feature-history/**/tickets.md`**; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

The graph is global across feature lines, but the only incomplete work now belongs to **FR-0002 budget entry page**. The eligible set has width 1 because `T-FR-0002-01` is the foundation ticket for contracts, persistence shape, cadence normalization, and reusable summary math. Later API, unified-summary integration, frontend page, and validation work intentionally fan out only after this contract ticket reaches VAL.

Use the feature-branch workflow from `docs/ai-context.md` §2d: create `feat/FR-0002-budget-entry-page`, then create ticket branches beneath it and merge them back to the feature branch before `finish-feature`.

---

## Cross-cutting work (parallel to tickets)

- Keep `tasks/ticket-progress.md` updates scoped to the ticket row being worked.
- Keep `docs/design/tickets-initial.md` `triadDone` markers in sync only after a ticket reaches TEST/DEV/VAL done.
- Preserve the FR-0002 design constraint: the sample spreadsheet informs content requirements only, not UI wording, layout, or visual design.
- Maintain repo-root `CURRENT.md` on `feat/FR-0002-budget-entry-page` and ticket branches once implementation branches exist.

---

## First concrete steps (primary next ticket)

1. Create or refresh the feature integration worktree at `.worktrees/FR-0002-budget-entry-page/feature/` on `feat/FR-0002-budget-entry-page`.
2. Start **Define budget allocation contracts** (`T-FR-0002-01`) in a child worktree/branch: `feat/FR-0002-budget-entry-page/T-FR-0002-01-define-budget-allocation-contracts`.
3. Follow the ticket phases in `tasks/feature-history/FR-0002-budget-entry-page/tickets.md`: TEST, then DEV, then VAL.
4. Run validation through Docker / Docker Compose / Dev Container paths where possible, and document any host-local exception in the ticket diary.
5. If **`feat/*`** implementation branches are in scope, refresh repo-root **`CURRENT.md`** on each affected **`feat/FR-0002-budget-entry-page`** branch so the parallel set and next actions match this handoff.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/FR-0002-budget-entry-page/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md` (global DAG + triadDone)
- `tasks/feature-history/FR-0002-budget-entry-page/handoffs/2026-04-30-design-handoff.md`
