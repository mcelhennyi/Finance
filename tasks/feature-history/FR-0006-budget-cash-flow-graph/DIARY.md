# DIARY - FR-0006 budget cash-flow graph

Consolidated newest-first diary for **FR-0006**. Raw source logs remain in [`serial-diary.md`](serial-diary.md) and [`parallel/`](parallel/).

---

## 2026-06-29 - edge and label deconfliction

**Source file:** `parallel/T-FR-0006-12-edge-label-deconfliction.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-12-edge-label-deconfliction`

Completed the post-closeout graph readability expansion. `cashFlowGraphRouting` now returns label geometry, reserves prior edge-label boxes and routed segment boxes, keeps labels clear of their own source/target nodes, and searches farther away from dense corridors before falling back. The Budget React Flow edge renderer uses route-provided fixed-width label positions with truncation, keeping the rendered label footprint aligned with the router reservation.

Validation passed: Docker frontend lint/focused routing tests/build (`21` focused tests), full frontend lint/test/build (`62` tests), backend full tests (`96` tests, one existing Starlette/httpx warning), strict docs build, diff hygiene, merge-marker scan, and browser VAL on the saved example Budget cash-flow map at desktop and 390px viewport. The browser sampler found `8` labels, `8` nodes, `16` SVG edge paths, and `0` label-label, label-node, or label-path collisions in both viewports.

---

## 2026-06-29 - finish-feature closeout drafted

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Confirmed **FR-0006** meets the feature-complete gate: **`T-FR-0006-01`** through **`T-FR-0006-11`** are TEST/DEV/VAL `done` in the tracker and canonical tickets. Updated closeout artifacts, cleared active parallel streams, and prepared PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) for refreshed human review.

Validation passed: `git diff --check`; `./scripts/check-frontend-no-merge-markers.sh`; Docker backend full tests (`96 passed`, one existing Starlette/httpx warning); Docker frontend lint/test/build (`58 passed`, existing Vite chunk-size warning); host `mkdocs build --strict` after Docker docs-service route was unavailable.

---

## 2026-06-29 - expandable allocation clusters with filters and counts

**Source file:** `parallel/T-FR-0006-11-allocation-clusters.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Completed display-only allocation clusters for the Budget cash-flow map. Account nodes show linked allocation counts with source/sink splits; one account can expand to show filtered allocation mini-nodes derived from `AllocationItem` endpoint fields. Budget allocation forms expose `allocation_role`, `from_account_ref`, `to_account_ref`, and `counterparty`.

Validation passed: focused cluster/flow/allocation tests, full frontend lint/test/build, and browser VAL on desktop and 390px viewport for paycheck source, owned savings sink, Amazon-style external sink, filters, empty expansion, no graph-node overlap, and no console errors. Docker API-image docs validation was blocked by missing `mkdocs`.

---

## 2026-06-29 - final expansion wave started

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

After **`T-FR-0006-10`** reached TEST/DEV/VAL `done`, the final dependency-valid expansion ticket was **`T-FR-0006-11`**.

---

## 2026-06-29 - orthogonal routing and obstacle-aware relayout

**Source file:** `parallel/T-FR-0006-10-orthogonal-routing.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Completed deterministic orthogonal routing for the Budget cash-flow map. Edges render through a custom React Flow edge backed by `cashFlowGraphRouting`: right-side source anchors, left-side target anchors, stable lane ordering, square SVG paths, obstacle-aware bend/lane selection, and cluster-aware relayout hooks.

Validation passed: Docker frontend gate, focused routing tests, desktop and 390px browser VAL, no graph-node overlap, no console errors, reload persistence, and a link/create/reload smoke.

---

## 2026-06-29 - frontier wave 2 started

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

First expansion wave completed in ticket streams: **`T-FR-0006-08`** and **`T-FR-0006-09`** were TEST/DEV/VAL `done`. The next dependency-valid ticket was **`T-FR-0006-10`**.

---

## 2026-06-29 - directional handles and double-click linking

**Source file:** `parallel/T-FR-0006-09-directional-linking.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Completed directional account linking in the Budget cash-flow map. Account nodes render left input handles and right output handles, derive visible role badges from incoming/outgoing edge incidence, and support double-click output-to-input linking through the save-before-link API path. The select/button fallback remains for accessibility and error handling.

Validation passed: Docker frontend lint/focused tests/build; browser VAL on desktop and 390px confirmed rendered nodes/handles, role labels, successful linking, duplicate/self-link errors, and no console errors.

---

## 2026-06-29 - unified source/sink allocation primitive contracts

**Source file:** `parallel/T-FR-0006-08-allocation-primitives.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Implemented source/sink allocation primitives. Allocation rows now carry `allocation_role`, nullable endpoint refs, and `counterparty`; endpoint refs validate against same-plan graph account nodes; graph replacement protects referenced nodes; source allocations can drive monthly income summaries while sink rows model external spend or owned-account storage.

Validation passed: Docker backend allocation/graph/seed tests (46 passed, one existing Starlette/httpx warning), focused allocation budget-sync regression (6 passed), and Docker frontend lint/test/build (47 tests at the time, existing Vite chunk-size warning).

---

## 2026-06-29 - frontier wave 1 started

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Ran the FR-0006 expansion frontier from the account routing/allocation addendum. The dependency-valid first wave was **`T-FR-0006-08`** and **`T-FR-0006-09`**; **`T-FR-0006-10`** waited on directional handles, and **`T-FR-0006-11`** waited on allocation endpoints plus routing.

---

## 2026-06-29 - expansion design for account routing and allocation primitives

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Added [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md) and the design mock for the account routing/allocation expansion. The expansion turned Budget allocations into explicit source/sink money-movement primitives and added tickets **`T-FR-0006-08`** through **`T-FR-0006-11`**.

---

## 2026-06-29 - directional account linking follow-up

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Added **`POST /api/budget-allocation/plans/{plan_id}/cash-flow-graph/links`** for directed account links, teal money-flow arrows in the graph, and Budget controls for source/destination account links. Validation covered backend graph tests, frontend flow tests/build, merge-marker guard, and browser smoke.

---

## 2026-05-10 - original finish-feature handoff and Budget UX

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Pushed the original integration branch and refreshed PR **#9** for the first FR-0006 slice. The original feature included persisted graph, API, Budget map, aggregation, BBD suggestions, and Budget UX refinements; later 2026-06-29 additions reopened the feature before final closeout.

---

## 2026-05-10 - time scrub and BBD suggestions

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Completed **`T-FR-0006-05`** and **`T-FR-0006-06`**: client cash-flow aggregation by grain and explicit BBD suggestion mapping/acceptance in the Budget graph.

---

## 2026-05-10 - Budget React Flow panel and graph API

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-04-react-flow` and feature integration branch

Completed **`T-FR-0006-03`** and **`T-FR-0006-04`**: graph CRUD API, React Flow Budget panel, API client wiring, save/reload graph round-trip, and Vite build support through Docker `NODE_OPTIONS`.

---

## 2026-05-10 - contracts, ORM, Compose default, and intake

**Source file:** `serial-diary.md`
**Git ref:** `feat/FR-0006-budget-cash-flow-graph`

Registered **FR-0006**, created the original tickets, implemented cash-flow graph contracts, ORM/migration stubs, and the Compose default review ticket. Initial frontier work covered **`T-FR-0006-01`**, **`T-FR-0006-02`**, and **`T-FR-0006-07`**.
