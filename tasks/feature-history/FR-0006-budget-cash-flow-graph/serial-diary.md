## 2026-06-29 (session) - edge and label deconfliction expansion completed

**Stage:** VAL / closeout on **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-12-edge-label-deconfliction`**

**Recap (plain English):** Completed [**Edge and label deconfliction**](tickets.md) (**`T-FR-0006-12`**) for the Budget cash-flow graph. Labels now use route-provided geometry, avoid their own source/target nodes as well as other nodes/clusters, reserve previous labels and route-line boxes, and render as fixed-width truncated chips so the DOM footprint matches the router reservation.

**Validation:** `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` passed with **21** focused tests; full frontend lint/test/build passed with **62** tests. `git diff --check`, `./scripts/check-frontend-no-merge-markers.sh`, and host `mkdocs build --strict` passed. Browser VAL on the saved example Budget graph at desktop and **390px** found **0** label-label, label-node, or label-path collisions across **8** labels, **8** nodes, and **16** edge paths.

---

## 2026-06-29 (session) - edge and label deconfliction expansion started

**Stage:** expand-feature / ticket implementation on **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-12-edge-label-deconfliction`**

**Recap (plain English):** Added a post-closeout FR-0006 expansion for [**Edge and label deconfliction**](tickets.md) (**`T-FR-0006-12`**) after the user asked to keep graph lines and line labels clear of other nodes, lines, and labels. The work stays inside FR-0006 because it refines the existing Budget cash-flow graph route layer, not a new product surface.

---

## 2026-06-29 (session) - finish-feature closeout drafted

**Stage:** finish-feature closeout on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Confirmed **FR-0006** meets the feature-complete gate: **`T-FR-0006-01`** through **`T-FR-0006-11`** are TEST/DEV/VAL `done` in the tracker and canonical tickets. Updated closeout artifacts, cleared active parallel streams, and prepared PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) for refreshed human review.

**Validation:** `git diff --check`; `./scripts/check-frontend-no-merge-markers.sh`; Docker backend full tests (`96 passed`, one existing Starlette/httpx warning); Docker frontend lint/test/build (`58 passed`, existing Vite chunk-size warning); host `mkdocs build --strict` after Docker docs-service route was unavailable.

---

## 2026-06-29 (session) - final expansion wave started

**Stage:** develop-frontier orchestration on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** [**Orthogonal routing and obstacle-aware relayout**](tickets.md) (**`T-FR-0006-10`**) reached TEST/DEV/VAL `done`, so the final FR-0006 expansion ticket is now dependency-valid: [**Expandable allocation clusters with filters and counts**](tickets.md) (**`T-FR-0006-11`**). This ticket should build on the source/sink allocation fields from **`T-FR-0006-08`** and the cluster-ready routing helpers from **`T-FR-0006-10`**.

---

## 2026-06-29 (session) - frontier wave 2 started

**Stage:** develop-frontier orchestration on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** First expansion wave completed in ticket streams: [**Unified source/sink allocation primitive contracts**](tickets.md) (**`T-FR-0006-08`**) and [**Directional account handles and double-click linking**](tickets.md) (**`T-FR-0006-09`**) are TEST/DEV/VAL `done`. The next dependency-valid ticket is [**Orthogonal routing and obstacle-aware relayout**](tickets.md) (**`T-FR-0006-10`**); [**Expandable allocation clusters with filters and counts**](tickets.md) (**`T-FR-0006-11`**) remains blocked until **`T-FR-0006-10`** is VAL-done.

---

## 2026-06-29 (session) - frontier wave 1 started

**Stage:** identify-frontier / develop-frontier orchestration on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Ran the FR-0006 expansion frontier from the account routing/allocation addendum. The dependency-valid first wave is [**Unified source/sink allocation primitive contracts**](tickets.md) (**`T-FR-0006-08`**) and [**Directional account handles and double-click linking**](tickets.md) (**`T-FR-0006-09`**); [**Orthogonal routing and obstacle-aware relayout**](tickets.md) (**`T-FR-0006-10`**) waits on **`T-FR-0006-09`**, and [**Expandable allocation clusters with filters and counts**](tickets.md) (**`T-FR-0006-11`**) waits on **`T-FR-0006-08`** plus **`T-FR-0006-10`**. Queue beacon and branch **`CURRENT.md`** now show the feature in `developing` status.

---

## 2026-06-29 (session) — expansion design for account routing and allocation primitives

**Stage:** expand-feature design / ticket expansion on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Added expansion addendum [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md) and mock [`docs/design/mockups/fr-0006-account-routing-allocation-expansion.html`](../../../docs/design/mockups/fr-0006-account-routing-allocation-expansion.html). The expansion keeps **FR-0006** open and turns Budget allocations into explicit source/sink cash-movement primitives: source allocations fund accounts, while sink allocations consume/store from accounts so paycheck deposits, savings sweeps, and purchases use the same model. New tickets cover [**Unified source/sink allocation primitive contracts**](tickets.md) (**`T-FR-0006-08`**), [**Directional account handles and double-click linking**](tickets.md) (**`T-FR-0006-09`**), [**Orthogonal routing and obstacle-aware relayout**](tickets.md) (**`T-FR-0006-10`**), and [**Expandable allocation clusters with filters and counts**](tickets.md) (**`T-FR-0006-11`**).

**Next:** Run **`/identify-frontier`**, then start **`T-FR-0006-08`** and **`T-FR-0006-09`** in child worktrees. Do **not** run **`/finish-feature`** until expansion tickets **`08`–`11`** are TEST/DEV/VAL `done`.

---

## 2026-06-29 (session) — directional account linking follow-up

**Stage:** DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Added **`POST /api/budget-allocation/plans/{plan_id}/cash-flow-graph/links`** to create one directed, relational **`CashFlowEdge`** between existing account nodes; **`CashFlowGraphPanel`** now renders money-flow edges with teal arrow markers and adds source / destination account controls that save current graph edits before creating the backend link. Selected edges show **source → destination** labels.

**Validation:** `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/test_cash_flow_graph_contracts.py tests/test_cash_flow_graph_models.py tests/test_api_cash_flow_graph.py -q"`; `docker compose run --rm web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"`; `./scripts/check-frontend-no-merge-markers.sh`; browser VAL on **Budget → Cash flow map** at desktop and **390×844** viewport (nonblank graph, arrow markers, account-link controls, no console errors).

---

## 2026-05-10 (session) — finish-feature handoff + Budget UX

**Stage:** VAL / handoff on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Pushed integration branch; **`docker compose run --rm --no-deps web npm run build`** green; PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) description refreshed; [**`handoffs/2026-05-10-finish-feature.md`**](handoffs/2026-05-10-finish-feature.md) records merge-ready scope and explicit note that **refinements and upgrades** land as **later features**. **`CURRENT.md`** / **`README.md`** updated for the reviewer.

---

## 2026-05-10 (session) — T-FR-0006-05 / T-FR-0006-06 time scrub + BBD suggestions

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** **`cashFlowTimeAggregation`** computes approximate in/out/net per node by grain (day/month/year); **`CashFlowGraphPanel`** adds grain selector + totals table (remainder edges contribute $0). **`bbdCashFlowSuggestions`** maps first projection year to proposed **`CashFlowEdgeSpec`** rows; operators run default **`POST /api/bbd-projection/run`** (MC off) and **Add edge** before **Save graph**. **`docker compose run --no-deps web`** **`npm ci`**, **`npm run test`**, **`npm run build`**.

**Manual VAL:** Budget → cash flow map → switch grain; optional **Generate suggestions from BBD** when API available → add edge → **Save graph** → **Reload**.

---

## 2026-05-10 (session) — T-FR-0006-04 Budget React Flow panel

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-04-react-flow`**

**Recap (plain English):** Added **`@xyflow/react`** **`CashFlowGraphPanel`** on **`BudgetPage`** (load/save **`GET`/`PUT …/cash-flow-graph`**), mapping helpers in **`frontend/src/lib/cashFlowGraphFlow.ts`** with vitest, budget allocation API client methods and types, **`docker compose run --no-deps web`** **`npm run build`** + **`npm test`**. Manual check: save graph then Reload restores persisted nodes/edges.

---

## 2026-05-10 (session) — T-FR-0006-04 Budget React Flow + graph API

**Stage:** TEST/DEV/VAL on ticket branch **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-04-react-flow`** (worktree **`.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-04-react-flow/`**)

**Recap (plain English):** Shipped **`CashFlowGraphPanel`** with **`@xyflow/react`** on **`BudgetPage`**: loads **`GET /api/budget-allocation/plans/{id}/cash-flow-graph`**, edits nodes/edges, saves via **`PUT`** with **`CashFlowGraphDocument`** typing. Added **`cashFlowGraphFlow`** round-trip helpers + Vitest. Compose **`web`** **`NODE_OPTIONS`** avoids Vite OOM during **`docker compose run web npm run build`**. Next: [**Cash-flow time scrub and aggregated views**](tickets.md) ([`T-FR-0006-05`](tickets.md)).

---

## 2026-05-10 (session) — T-FR-0006-03 cash-flow graph CRUD API

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Implemented **`get_plan_graph`** / **`replace_plan_graph`** (flush after replace so same-session reads see edges), **`GET`/`PUT /api/budget-allocation/plans/{plan_id}/cash-flow-graph`**, and **`tests/test_api_cash_flow_graph.py`**. Budget allocation REST (`finance.allocation` + **`budget_allocation`** router) is included as the host module for graph routes. **`httpx`** added for TestClient. Next: [**Budget React Flow panel wired to graph API**](tickets.md) ([`T-FR-0006-04`](tickets.md)).

---

## 2026-05-10 (session) — T-FR-0006-02 ORM + migration stub

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Added **`CashFlowNode`** and **`CashFlowEdge`** SQLAlchemy models (plan FK, unique `(plan_id, ref)`, edge FKs to nodes), **`phase2_cash_flow_graph_stub.sql`**, and **`tests/test_cash_flow_graph_models.py`** (round-trip, cascade delete, unique constraint). Next: [**Expose cash-flow graph CRUD API**](tickets.md) ([`T-FR-0006-03`](tickets.md)).

---

## 2026-05-10 (session) — develop-frontier wave: T-FR-0006-01 + T-FR-0006-07

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Implemented [**Define cash-flow graph persistence contracts**](tickets.md) ([`T-FR-0006-01`](tickets.md)) as `finance.cash_flow_graph` (enums + `CashFlowGraphDocument`) with pytest coverage. Completed [**Compose default for allocation auto-template**](tickets.md) ([`T-FR-0006-07`](tickets.md)): Compose default **`false`**, docs/scripts updated. Frontier handoff: [`tasks/handoffs/2026-05-10-parallel-frontier.md`](../../handoffs/2026-05-10-parallel-frontier.md). Next: [**Add cash-flow graph migration and ORM models**](tickets.md) ([`T-FR-0006-02`](tickets.md)).

---

## 2026-05-10 (session) — feature-request intake + tickets

**Stage:** intake, L0 design, **`tickets.md`** + global DAG registration

**Recap (plain English):** Registered **`FR-0006`** for persisted **cash-flow graph** work from [`tasks/handoffs/2026-05-10-budget-cash-flow-session-handoff.md`](../../handoffs/2026-05-10-budget-cash-flow-session-handoff.md) and [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md). Seven tickets cover contracts → migration → API → **React Flow** → time aggregation → **BBD** suggestions → **Compose** env default. Next: commit/push registry stub per **`REGISTRY.md`** policy, then **`/identify-frontier`** / **`/develop-frontier`** starting with [**Define cash-flow graph persistence contracts**](tickets.md) ([`T-FR-0006-01`](tickets.md)) and optionally [**Compose default for allocation auto-template**](tickets.md) ([`T-FR-0006-07`](tickets.md)).
