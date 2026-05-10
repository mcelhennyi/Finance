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

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Freeze contracts | Contract tests / schema examples cover node/edge validation, scope key, and rejection of invalid graphs |
| **DEV** | Implement shared types | Pydantic models (and any shared TS types or OpenAPI-generated stubs policy) documented; no DB write yet |
| **VAL** | Cross-team readability | Design doc references updated if contracts differ from sketch; **`tickets.md`** deps still valid |

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

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Model behavior | Unit tests cover model constraints, cascades, and round-trip fixture inserts |
| **DEV** | Implement persistence | Migration + SQLAlchemy models registered; matches contracts |
| **VAL** | DB hygiene | Migration applies cleanly in Docker/CI init path; no regression on existing tables |

#### Notes

- Follow existing **`Mapped[...]`** / **`DeclarativeBase`** patterns in `src/finance/db/models.py`.

---

### T-FR-0006-03 — Expose cash-flow graph CRUD API

**Title:** Expose cash-flow graph CRUD API  
**Deps:** `T-FR-0006-02`

#### Purpose

Expose **read** and **replace** (or fine-grained CRUD) endpoints for the graph for a scoped **plan** (or agreed key), with typed responses and errors.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | API behavior | `httpx` / TestClient tests: empty graph, full replace, validation failures, wrong plan id |
| **DEV** | Implement router | FastAPI router + service layer; OpenAPI documents payloads |
| **VAL** | Integration | Tests pass in container; routes registered in **`main.py`** |

#### Notes

- Do not log institution names or amounts at **DEBUG** in production paths (privacy rule).

---

### T-FR-0006-04 — Budget React Flow panel wired to graph API

**Title:** Budget React Flow panel wired to graph API  
**Deps:** `T-FR-0006-03`

#### Purpose

Add **`@xyflow/react`** (or agreed package) to the **Budget** experience: **load** graph from API, **edit** nodes/edges, **save** back; accessible layout and loading/error states.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | FE helpers | Vitest (or agreed) coverage for DTO mapping / graph diff helpers if non-trivial |
| **DEV** | Implement UI | Panel embedded on `BudgetPage` (or sub-route); API client methods |
| **VAL** | E2E smoke | `docker compose run … npm run build` passes; manual note: save/reload round-trip |

#### Notes

- Reuse **Budget** dock/docs patterns where helpful; no static SVG graph placeholders.

---

### T-FR-0006-05 — Cash-flow time scrub and aggregated views

**Title:** Cash-flow time scrub and aggregated views  
**Deps:** `T-FR-0006-04`

#### Purpose

Deliver **P3** from [`docs/design/budget-cash-flow-graph.md`](../../../docs/design/budget-cash-flow-graph.md): time controls (day/month/year), aggregated balances, optional **`CashFlowSnapshot`** materialization if justified by performance.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Time math | Tests cover aggregation windows and edge cases (empty graph, zero flows) |
| **DEV** | Implement UX + API | Controls in SPA; server or client aggregation per design decision |
| **VAL** | Performance sanity | Documented check on realistic graph size; no blocking main-thread regressions |

---

### T-FR-0006-06 — BBD-suggested cash-flow edges

**Title:** BBD-suggested cash-flow edges  
**Deps:** `T-FR-0006-04`, `T-FR-0003-02`

#### Purpose

**P4** bridge: **explicit** UX/API to attach **suggested** edges from BBD outputs; operators **accept** before persistence — no silent writes (per [`docs/design/budget-plans-roadmap.md`](../../../docs/design/budget-plans-roadmap.md)).

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | Suggestion mapping | Tests for mapping projection artifacts → proposed edges (fixture JSON) |
| **DEV** | Implement integration | API + minimal UI affordance; design doc **`DESIGN-GAP`** cleared or tagged |
| **VAL** | Operator clarity | Doc note in operator guide; manual walkthrough recorded in diary |

---

### T-FR-0006-07 — Compose default for allocation auto-template

**Title:** Compose default for allocation auto-template  
**Deps:** none

#### Purpose

Resolve handoff **option A**: align **`docker-compose.yml`** (and **`scripts/README.md`** if needed) so **`FINANCE_ALLOCATION_AUTO_TEMPLATE`** defaults match **dev vs prod-like** expectations documented in [`docs/design/budget-plans-roadmap.md`](../../../docs/design/budget-plans-roadmap.md).

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|----------------|
| **TEST** | — | N/A or doc-only |
| **DEV** | Change defaults/docs | Compose + README reflect chosen default; rationale in commit or feature diary |
| **VAL** | Verify | `docker compose config` sanity; optional one-line operator note |

#### Notes

- Keep behavior **explicit**; do not change runtime semantics beyond default env.

---
