# Tickets — FR-0006 budget cash-flow graph

**Feature id:** **`FR-0006`**  
**Canonical ids:** **`T-FR-0006-xx`**

---

### T-FR-0006-01 — Define cash-flow graph persistence contracts

**Title:** Define cash-flow graph persistence contracts  
**Deps:** `T-FR-0002-02`

#### Purpose

Lock **DTOs**, **enums** (`CashNode` kinds, amount rules, cadence), and **scope** (graph per **allocation plan** vs alternate keying) so migrations, API, and React Flow agree. Resolve **open decisions** in [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md) enough to implement **P1**/**P2**.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Freeze contracts | Contract tests / schema examples cover node/edge validation, scope key, and rejection of invalid graphs | done |
| **DEV** | Implement shared types | Pydantic models (and any shared TS types or OpenAPI-generated stubs policy) documented; no DB write yet | done |
| **VAL** | Cross-team readability | Design doc references updated if contracts differ from sketch; **`tickets.md`** deps still valid | done |

**VAL notes:** Scope = **`plan_id`** → **`allocation_plans.id`** (`CashFlowGraphDocument`). Implemented `src/finance/cash_flow_graph/`; tests `tests/test_cash_flow_graph_contracts.py`.

#### Notes

- Prefer **explicit FK** to **`allocation_plans`** (or documented alternative) — no orphan graphs.
- **`CashFlowSnapshot`** stays optional until **T-FR-0006-05**.

---

### T-FR-0006-02 — Add cash-flow graph migration and ORM models

**Title:** Add cash-flow graph migration and ORM models  
**Deps:** `T-FR-0006-01`

#### Purpose

Persist **`CashNode`** and **`CashFlowEdge`** per **T-FR-0006-01** contracts with Alembic/SQL migration path consistent with repo conventions.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Model behavior | Unit tests cover model constraints, cascades, and round-trip fixture inserts | done |
| **DEV** | Implement persistence | Migration + SQLAlchemy models registered; matches contracts | done |
| **VAL** | DB hygiene | Migration applies cleanly in Docker/CI init path; no regression on existing tables | done |

**VAL notes:** `CashFlowNode` / `CashFlowEdge` on `Base`; stub SQL `phase2_cash_flow_graph_stub.sql`; `tests/test_cash_flow_graph_models.py`; `docker compose run … pytest` green.

#### Notes

- Follow existing **`Mapped[...]`** / **`DeclarativeBase`** patterns in `src/finance/db/models.py`.

---

### T-FR-0006-03 — Expose cash-flow graph CRUD API

**Title:** Expose cash-flow graph CRUD API  
**Deps:** `T-FR-0006-02`

#### Purpose

Expose **read** and **replace** (or fine-grained CRUD) endpoints for the graph for a scoped **plan** (or agreed key), with typed responses and errors.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | API behavior | `httpx` / TestClient tests: empty graph, full replace, validation failures, wrong plan id | done |
| **DEV** | Implement router | FastAPI router + service layer; OpenAPI documents payloads | done |
| **VAL** | Integration | Tests pass in container; routes registered in **`main.py`** | done |

**VAL notes:** `GET`/`PUT /api/budget-allocation/plans/{plan_id}/cash-flow-graph`; `finance.cash_flow_graph.service` (`get_plan_graph`, `replace_plan_graph`); `tests/test_api_cash_flow_graph.py`; requires budget allocation router (`finance.allocation`) for shared **`budget_allocation`** router module.

#### Notes

- Do not log institution names or amounts at **DEBUG** in production paths (privacy rule).

---

### T-FR-0006-04 — Budget React Flow panel wired to graph API

**Title:** Budget React Flow panel wired to graph API  
**Deps:** `T-FR-0006-03`

#### Purpose

Add **`@xyflow/react`** (or agreed package) to the **Budget** experience: **load** graph from API, **edit** nodes/edges, **save** back; accessible layout and loading/error states.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | FE helpers | Vitest (or agreed) coverage for DTO mapping / graph diff helpers if non-trivial | done |
| **DEV** | Implement UI | Panel embedded on `BudgetPage` (or sub-route); API client methods | done |
| **VAL** | E2E smoke | `docker compose run … npm run build` passes; manual note: save/reload round-trip | done |

**VAL notes:** `@xyflow/react` **`CashFlowGraphPanel`** on **`BudgetPage`**; **`api.getBudgetCashFlowGraph`** / **`putBudgetCashFlowGraph`**; **`frontend/src/lib/cashFlowGraphFlow.ts`** + vitest; **`docker compose run --rm --no-deps web npm run build`** + **`npm test`** in container; root **`docker-compose.yml`** sets **`web.environment.NODE_OPTIONS`** so Vite build does not OOM in typical Docker limits. Manual: **Save graph** then **Reload** for round-trip.

#### Notes

- Reuse **Budget** dock/docs patterns where helpful; no static SVG graph placeholders.

---

### T-FR-0006-05 — Cash-flow time scrub and aggregated views

**Title:** Cash-flow time scrub and aggregated views  
**Deps:** `T-FR-0006-04`

#### Purpose

Deliver **P3** from [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md): time controls (day/month/year), aggregated balances, optional **`CashFlowSnapshot`** materialization if justified by performance.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Time math | Tests cover aggregation windows and edge cases (empty graph, zero flows) | done |
| **DEV** | Implement UX + API | Controls in SPA; server or client aggregation per design decision | done |
| **VAL** | Performance sanity | Documented check on realistic graph size; no blocking main-thread regressions | done |

**VAL notes:** Client **`aggregateNodeFlows`** / **`cashFlowTimeAggregation`** + grain selector on **`CashFlowGraphPanel`**; plan income wired for percent edges; **`docker compose run … npm run build`** + **`npm run test`**.

#### Notes

- **`CashFlowSnapshot`** not materialized — client aggregation sufficient at this stage.

---

### T-FR-0006-06 — BBD-suggested cash-flow edges

**Title:** BBD-suggested cash-flow edges  
**Deps:** `T-FR-0006-04`, `T-FR-0003-02`

#### Purpose

**P4** bridge: **explicit** UX/API to attach **suggested** edges from BBD outputs; operators **accept** before persistence — no silent writes (per [`docs/design/budget-plans-roadmap.md`](../../../docs/design/budget-plans-roadmap.md)).

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Suggestion mapping | Tests for mapping projection artifacts → proposed edges (fixture JSON) | done |
| **DEV** | Implement integration | API + minimal UI affordance; design doc **`DESIGN-GAP`** cleared or tagged | done |
| **VAL** | Operator clarity | Doc note in operator guide; manual walkthrough recorded in diary | done |

**VAL notes:** **`bbdCashFlowSuggestions`** maps **`BbdRunResponse.schedule[0]`** to proposed **`CashFlowEdgeSpec`**; Budget UI runs **`POST /api/bbd-projection/run`** (default scenario, MC off) then **Add edge** per suggestion; serial diary walkthrough.

#### Notes

- **`DESIGN-GAP`:** Heuristic mapping only — refine when projection exposes richer cash-flow facts (tagged in **`bbdCashFlowSuggestions.ts`**).

---

### T-FR-0006-07 — Compose default for allocation auto-template

**Title:** Compose default for allocation auto-template  
**Deps:** none

#### Purpose

Resolve handoff **option A**: align **`docker-compose.yml`** (and **`scripts/README.md`** if needed) so **`FINANCE_ALLOCATION_AUTO_TEMPLATE`** defaults match **dev vs prod-like** expectations documented in [`docs/design/budget-plans-roadmap.md`](../../../docs/design/budget-plans-roadmap.md).

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | — | N/A or doc-only | done |
| **DEV** | Change defaults/docs | Compose + README reflect chosen default; rationale in commit or feature diary | done |
| **VAL** | Verify | `docker compose config` sanity; optional one-line operator note | done |

**VAL notes:** `FINANCE_ALLOCATION_AUTO_TEMPLATE` default **`false`** in `docker-compose.yml`; `scripts/README.md` + `docs/design/budget-plans-roadmap.md` aligned.

#### Notes

- Keep behavior **explicit**; do not change runtime semantics beyond default env.

---

### T-FR-0006-08 — Unified source/sink allocation primitive contracts

**Title:** Unified source/sink allocation primitive contracts
**Deps:** `T-FR-0006-03`

#### Purpose

Implement the contract from [`30-expand-2026-06-29-account-routing-allocations.md`](30-expand-2026-06-29-account-routing-allocations.md): allocation rows become explicit source or sink primitives. Rows may link to plan-local graph account endpoints through `from_account_ref` and `to_account_ref` so payroll, savings storage, and purchases are modeled consistently without a third transfer role.

#### Existing changes required

- Extend `AllocationItem` persistence, migration stubs, schemas, router mapping, services, seed YAML import/export, and API tests.
- Update summary logic so source allocations can drive income totals and sink allocations can represent external spend or owned-account storage without double-counting net income/spend.
- Preserve backward compatibility for existing expense-only rows by defaulting old rows to `allocation_role='sink'` with null endpoints.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Freeze allocation primitive contract | Backend tests cover default `allocation_role`, source/sink summary math, valid endpoint refs, invalid endpoint refs, graph-save rejection when a referenced account is deleted, and seed import/export round trips | done |
| **DEV** | Implement data model + API | ORM, SQL stub/migration, Pydantic schemas, service validation, router outputs, frontend types, and budget allocation payload helpers support `allocation_role`, `from_account_ref`, `to_account_ref`, and `counterparty` | done |
| **VAL** | Container verification | Docker backend tests for allocation + graph APIs pass; Docker frontend lint/test/build passes for updated TS contracts; no existing Budget expense rows break | done |

**VAL notes:** Allocation rows now carry `allocation_role`, `from_account_ref`, `to_account_ref`, and `counterparty`; endpoint refs validate against same-plan cash-flow nodes, and graph replacement rejects deleting referenced account nodes. Docker backend allocation/graph/seed tests passed (46 tests plus focused budget-sync regression), and Docker frontend lint/test/build passed with the existing Vite chunk-size warning.

#### Implementation notes

- Suggested fields: `allocation_role` (`source`, `sink`), `from_account_ref`, `to_account_ref`, optional `counterparty`.
- Validate endpoint refs against `CashFlowNode.ref` for the same `plan_id` when non-null.
- Do not FK to `cash_flow_nodes.id`; graph replace currently deletes/reinserts rows.
- Existing `AllocationPlan.income_amount` remains a compatibility fallback. When a plan has source allocations, summaries should prefer those rows.

#### Verification notes

- Backend: `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/test_api_budget_allocation.py tests/test_api_cash_flow_graph.py tests/test_allocation_contracts.py tests/test_seed_budget_allocation_yaml.py -q"`
- Frontend: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"`

---

### T-FR-0006-09 — Directional account handles and double-click linking

**Title:** Directional account handles and double-click linking
**Deps:** `T-FR-0006-04`

#### Purpose

Make graph account linking direct on the node: left side is input, right side is output. Double-clicking an output side then an input side creates the account link through the existing graph API. Nodes show pure source, pure sink, source + sink, or unlinked role state.

#### Existing changes required

- Replace the current top/bottom node handles in `CashFlowGraphPanel` with left/right handles.
- Move account-link behavior from the select-box block toward direct node-edge interactions while keeping an accessible fallback action.
- Add tests for role derivation and link-state transitions in `cashFlowGraphFlow` or a new focused helper.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Define role/link behavior | Frontend unit tests cover source/sink/source+sink/unlinked role derivation, pending source selection, completed link, duplicate edge rejection, self-link rejection, and keyboard/action-menu fallback | done |
| **DEV** | Implement handles + gesture | Account nodes render left input/right output handles; double-click flow creates directed edges; existing save-before-link behavior remains; visible error state handles invalid links | done |
| **VAL** | Browser interaction check | Docker frontend checks pass; rendered Budget graph inspection confirms handles are visible and linkable at desktop and phone viewports with no console errors | done |

**VAL notes:** Account nodes now expose left input and right output handles, derive visible role badges from edge incidence, support double-click output-to-input linking, and keep the accessible fallback controls. Docker frontend lint/focused tests/build passed; browser VAL confirmed desktop and 390px rendering, successful linking, duplicate/self-link errors, and no console errors.

#### Implementation notes

- Treat output-side double click as "start from this account"; input-side double click as "finish to this account."
- A neutral/unlinked account may expose both handles until edge incidence establishes its role.
- Keep a button/menu fallback for users who cannot use double-click.

#### Verification notes

- Frontend: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"`
- Browser VAL: Budget -> Cash flow map; exercise source -> sink link, invalid self-link, duplicate link, and reload.

---

### T-FR-0006-10 — Orthogonal routing and obstacle-aware relayout

**Title:** Orthogonal routing and obstacle-aware relayout
**Deps:** `T-FR-0006-09`

#### Purpose

Replace default curved/overlapping graph lines with deterministic square routing. Edges leave right-side outputs, enter left-side inputs, reserve separate lanes for multiple outgoing lines, and route around visible account nodes and expanded allocation clusters.

#### Existing changes required

- Add a tested routing/layout helper under `frontend/src/lib/`.
- Update `cashFlowGraphFlow` / React Flow edge rendering to use custom orthogonal paths.
- Relayout graph nodes after graph load, account link creation, node drag where needed, and expansion/collapse events.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Route around common obstacles | Unit tests cover multiple outgoing edges from one node, crossing avoidance around one obstacle box, square path generation, stable lane ordering, and relayout after cluster height changes | done |
| **DEV** | Implement routing + relayout | Custom edge paths render with square corners; outgoing lanes do not overlap; layout helper reserves space for expanded clusters and avoids account-node overlap | done |
| **VAL** | Visual non-overlap check | Docker frontend checks pass; rendered graph inspection verifies nonblank orthogonal routes, no obvious overlap, and stable relayout after expand/collapse | done |

**VAL notes:** `cashFlowGraphRouting` now builds deterministic square paths, stable per-source lanes, obstacle-aware bends, and cluster-aware relayout data for custom React Flow edges. Docker frontend lint/focused tests/build passed; browser VAL confirmed nonblank orthogonal routes, reload persistence, phone rendering, and no graph-node overlap.

#### Implementation notes

- Prefer a small deterministic helper before adding a layout/routing dependency.
- Store user-dragged positions only for account nodes; allocation mini-node positions should be derived.
- If multiple expanded accounts are too dense for first pass, document and enforce one-expanded-account-at-a-time until a later ticket.

#### Verification notes

- Frontend: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"`
- Browser VAL: inspect desktop and 390px-width Budget graph states with several account links and one expanded allocation cluster.

---

### T-FR-0006-11 — Expandable allocation clusters with filters and counts

**Title:** Expandable allocation clusters with filters and counts
**Deps:** `T-FR-0006-08`, `T-FR-0006-10`

#### Purpose

Show each account's linked allocation count on the node and let operators expand that account to inspect allocation mini-nodes beneath it. Expanded allocations are explicitly source or sink allocations and can be filtered by size, cadence/frequency, allocation role, payment method, category, counterparty, endpoint role, and due-day range.

#### Existing changes required

- Pass or query allocation items in `CashFlowGraphPanel` and derive per-account total/visible counts from `from_account_ref` and `to_account_ref`.
- Render allocation mini-nodes below the expanded account using the relayout helper from `T-FR-0006-10`.
- Update Budget allocation UI fields so operators can set allocation role and account endpoints when creating or editing rows.
- Document the operator workflow in `docs/design/budget-plans-roadmap.md` and `scripts/README.md` if validation commands or seed behavior change.

#### Phases

| Phase | Goal | Exit criteria | Status |
|-------|------|---------------|--------|
| **TEST** | Define counts/filter behavior | Frontend tests cover account totals, source/sink splits, visible counts after filters, source/sink mini-node labels, empty account expansion, and relayout after filter changes | done |
| **DEV** | Implement expansion UI | Account badges show allocation counts and source/sink split; expanded clusters render mini-nodes in rows/columns; filters update visible rows/totals; Budget allocation forms expose allocation role and endpoints | done |
| **VAL** | Full Budget graph workflow | Docker frontend checks pass; rendered browser inspection covers linked paycheck source, savings sink, Amazon-style sink, filters, expand/collapse, phone viewport, and no overlap/console errors | done |

**VAL notes:** `CashFlowGraphPanel` now renders account allocation counts, one expanded allocation cluster, source/sink mini-nodes, filters, and relayout/rerouting around the cluster. `BudgetPage` allocation forms expose role, endpoint refs, and counterparty. Docker frontend lint/test/build passed; browser VAL covered paycheck source, owned savings sink, external Amazon-style sink, filters, desktop/phone viewports, and no graph-node overlap.

#### Implementation notes

- Counts include any allocation where `from_account_ref` or `to_account_ref` equals the account ref.
- Expanded visible totals should separate source and sink totals; sink totals with owned `to_account_ref` should be shown as storage/transfer-style sinks so they do not look like external spend.
- Filters should be stateful per expanded account during the session but do not need persistence in the first pass.
- Allocation mini-nodes are derived UI nodes, not persisted `CashFlowNode` rows.

#### Verification notes

- Frontend: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"`
- Browser VAL: Budget -> Cash flow map and Allocation lines on desktop and phone; verify text fit, count badges, filter controls, relayout, and accessible fallback for linking.

---
