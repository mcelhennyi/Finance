# Next-step handoff — parallel frontier (2026-05-10)

**Audience:** Next agent or maintainer picking up work from `main` / **`feat/FR-0006-budget-cash-flow-graph`**.
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | Continue **`FR-0006`** with [**Add cash-flow graph migration and ORM models**](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-02`](feature-history/FR-0006-budget-cash-flow-graph/tickets.md)) after merging contract work |
| **Active phase** | — |
| **Branch / worktree** | **`feat/FR-0006-budget-cash-flow-graph`** (feature integration); ticket branches optional per **`develop-frontier`** |
| **Session status** | `developing` → advance to `ready` after next merge checkpoint |
| **Next agent should** | Merge or continue on feature branch; run **`/identify-frontier`** after **`T-FR-0006-02`** VAL |

**Triad-complete (summary):** All tickets through **`T-FR-0005-01`** plus **`T-FR-0006-01`** (**Define cash-flow graph persistence contracts**) and **`T-FR-0006-07`** (**Compose default for allocation auto-template**) once this session’s commits land and **`ticket-progress.md`** is updated.

**Still incomplete (summary):** **`T-FR-0006-02`** … **`T-FR-0006-06`** (graph persistence, API, React Flow, time scrub, BBD suggestions).

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

After **`T-FR-0006-01`** reaches **VAL** `done`, **`T-FR-0006-02`** becomes eligible (**Deps:** `T-FR-0006-01`). **`T-FR-0006-07`** had **`Deps: none`** and was parallel with **`T-FR-0006-01`** (same feature **`FR-0006`**, global graph §2c).

**Wave just executed (dependency-valid):**

| Ticket | Title | Deps |
|--------|-------|------|
| [T-FR-0006-01](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Define cash-flow graph persistence contracts | `T-FR-0002-02` (VAL done) |
| [T-FR-0006-07](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Compose default for allocation auto-template | none |

So **up to 2 parallel streams** were valid: both under **`feat/FR-0006-budget-cash-flow-graph`** / **`.worktrees/FR-0006-budget-cash-flow-graph/...`** per policy.

**Examples of what stays blocked until more VAL-done rows exist:**

- **`T-FR-0006-03`** (CRUD API) until **`T-FR-0006-02`** is triad-complete.
- **`T-FR-0006-04`** until **`T-FR-0006-03`**.
- **`T-FR-0006-05`** / **`T-FR-0006-06`** until **`T-FR-0006-04`** (and **`T-FR-0003-02`** for **06**).

Full **Deps:** edges: `tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md`; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

**`ticket-progress.md`** is updated when **`T-FR-0006-01`** and **`T-FR-0006-07`** are marked **done** for all three phases. **`Parallel streams`** can list both ticket ids while open, then clear when merged to the feature branch.

---

## Cross-cutting work (parallel to tickets)

- **`CURRENT.md`** on **`feat/FR-0006-budget-cash-flow-graph`** should reflect the merged tip after this wave.
- Run **`docker compose run … pytest`** (or CI equivalent) for **`tests/test_cash_flow_graph_contracts.py`** and existing allocation tests after Compose default change.

---

## First concrete steps (primary next ticket)

1. Implement [**Add cash-flow graph migration and ORM models**](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-02`](feature-history/FR-0006-budget-cash-flow-graph/tickets.md)): tables keyed by **`allocation_plans.id`**, FK to **`T-FR-0006-01`** contracts.
2. Refresh repo-root **`CURRENT.md`** on **`feat/FR-0006-budget-cash-flow-graph`** after **`T-FR-0006-02`** **DEV** / **VAL**.
3. Re-run **`/identify-frontier`** — expect **`T-FR-0006-03`** alone unless other global tickets become eligible.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/**/tickets.md`
- `tasks/feature-history/TICKET-SOURCES.md`
- `docs/design/tickets-initial.md` (global DAG + triadDone)
- `src/finance/cash_flow_graph/` (contracts from **T-FR-0006-01**)
- `docker-compose.yml`, `scripts/README.md`, `docs/design/budget-plans-roadmap.md` (**T-FR-0006-07**)
