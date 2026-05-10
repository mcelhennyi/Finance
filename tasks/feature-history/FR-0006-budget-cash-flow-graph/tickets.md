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
