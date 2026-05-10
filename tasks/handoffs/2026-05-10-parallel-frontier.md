# Next-step handoff — parallel frontier (2026-05-10)

**Audience:** Next agent or maintainer picking up work from **`feat/FR-0006-budget-cash-flow-graph`** (draft PR → **`master`**).
**Authority:** `tasks/feature-history/**/tickets.md`, `tasks/ticket-progress.md`, `docs/design/tickets-initial.md` (DAG), `docs/ai-context.md`.

---

## Snapshot: queue beacon (`tasks/ticket-progress.md`)

| Field | Value (as of this handoff) |
|------|----------------------------|
| **Active ticket** | [**Budget React Flow panel wired to graph API**](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) ([`T-FR-0006-04`](feature-history/FR-0006-budget-cash-flow-graph/tickets.md)) |
| **Active phase** | — |
| **Branch / worktree** | Feature integration **`feat/FR-0006-budget-cash-flow-graph`**; ticket worktree optional under **`.worktrees/FR-0006-budget-cash-flow-graph/`** |
| **Session status** | `developing` (single-stream **`FR-0006`** frontier) |
| **Next agent should** | Implement **`T-FR-0006-04`** (TEST→DEV→VAL); validate with **`docker compose run … npm run build`** on **`web`** and Vitest as per ticket; merge ticket branch → **`feat/FR-0006-budget-cash-flow-graph`**; do **not** finish-feature to **`master`** until **`FR-0006`** **`tickets.md`** is complete |

**Triad-complete (summary):** Through **`T-FR-0006-03`** (**Expose cash-flow graph CRUD API**) inclusive, plus **`T-FR-0006-07`**.

**Still incomplete (summary):** **`T-FR-0006-04`** … **`T-FR-0006-06`**.

---

## Snapshot: what the dependency graph allows in parallel

**Eligibility rule:** Every ticket in **Deps:** has **VAL** = `done` in `tasks/ticket-progress.md`.

With **`T-FR-0006-03`** **VAL** `done`, only **`T-FR-0006-04`** is newly eligible among **`FR-0006`** backlog items. No other global **`FR-NNNN`** tickets are incomplete in **`ticket-progress.md`**.

**Current parallel-capable set (single ticket):**

| Ticket | Title | Deps |
|--------|-------|------|
| [T-FR-0006-04](feature-history/FR-0006-budget-cash-flow-graph/tickets.md) | Budget React Flow panel wired to graph API | `T-FR-0006-03` |

So **one** dependency-valid stream: child worktree **`feat/FR-0006-budget-cash-flow-graph/T-FR-0006-04-<short-name>/`** under **`.worktrees/FR-0006-budget-cash-flow-graph/`**, branch from **`feat/FR-0006-budget-cash-flow-graph`**.

**Examples of what stays blocked:**

- **`T-FR-0006-05`** until **`T-FR-0006-04`** is triad-complete.
- **`T-FR-0006-06`** until **`T-FR-0006-04`** and **`T-FR-0003-02`** (**already VAL done**).

Full **Deps:** edges: `tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md`; global mermaid in `docs/design/tickets-initial.md`.

---

## Process note (queue vs graph)

Update **`tasks/ticket-progress.md`** **only** for **`T-FR-0006-04`** rows while this ticket is active. After **VAL** `done`, add **`triadDone`** for **`TFR0006_04_*`** in **`docs/design/tickets-initial.md`**.

---

## Cross-cutting work (parallel to tickets)

- **`GET`/`PUT`** graph API: `/api/budget-allocation/plans/{plan_id}/cash-flow-graph` ( **`finance.cash_flow_graph.service`** ).
- Design reference: [`docs/design/budget-cash-flow-graph.md`](../../docs/design/budget-cash-flow-graph.md).
- Uncommitted **Budget** SPA work may exist on developer machines from **`FR-0002`**/**`FR-0005`** — reconcile with **`feat/FR-0006-budget-cash-flow-graph`** tip (**`9cae57c`**+) before large UI merges.

---

## First concrete steps (primary next ticket)

1. Create feature integration checkout / worktree for **`feat/FR-0006-budget-cash-flow-graph`** if missing; branch **`feat/FR-0006-budget-cash-flow-graph/T-FR-0006-04-<slug>`** from it for isolated **`TEST→DEV→VAL`**.
2. Implement [**Budget React Flow panel wired to graph API**](feature-history/FR-0006-budget-cash-flow-graph/tickets.md): **`@xyflow/react`** (or agreed), load/save via API client, embedded on **`BudgetPage`** per ticket phases.
3. Run **`docker compose run … npm run build`** ( **`web`** ) for **VAL**; update **`tickets.md`** phase table and **`serial-diary.md`** on completion.

---

## Related files

- `tasks/ticket-progress.md`
- `tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md`
- `CURRENT.md` (feature branch)
- `frontend/` — Budget page, API client (`cash-flow-graph` routes)
- `docs/design/tickets-initial.md` (global DAG + triadDone)
