# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | — (**`FR-0006`** implementation tickets triad-complete on branch — run **`/finish-feature`**) |
| **Active phase** | — |
| **Branch / worktree** | **`feat/FR-0006-budget-cash-flow-graph`** |
| **Session status** | `ready` |
| **Next agent should** | **`/finish-feature`** for **`FR-0006`** — open/update PR **`feat/FR-0006-budget-cash-flow-graph` → `master`** per skill; draft **#9**; registry **`90-closeout`** when merged. |

### Parallel streams (optional)

Use when **more than one** ticket id or **`FR-NNNN`** is actively developed in parallel. Each stream: own `.worktrees/FR-NNNN-<slug>/...` worktree and feature-prefixed branch; update **only** your **Progress** row for your ticket.

| Stream label | Ticket(s) | `FR-NNNN` (if any) | Branch / worktree | Owner / note |
|----------------|------------|--------------------|-------------------|--------------|
| *(none)* | — | — | — | **`FR-0006`** tickets **`01`–`07`** triad-complete on **`feat/…`** |

**Completed features** (`REGISTRY.md` → **`complete`**) are **not** listed in **Parallel streams** — they are closed out with **`90-closeout.md`** in **`tasks/feature-history/FR-NNNN-<slug>/`** (see **`.cursor/skills/feature-request/SKILL.md`** → **Closeout**). **`FR-0002`** closeout: [`FR-0002-budget-entry-page/90-closeout.md`](feature-history/FR-0002-budget-entry-page/90-closeout.md). **`FR-0003`** closeout: [`FR-0003-bbd-projection-ui/90-closeout.md`](feature-history/FR-0003-bbd-projection-ui/90-closeout.md). **`FR-0004`** closeout: [`FR-0004-bbd-projection-experience/90-closeout.md`](feature-history/FR-0004-bbd-projection-experience/90-closeout.md).

---

## Progress

| Ticket | Title | TEST | DEV | VAL | Notes |
|--------|-------|------|-----|-----|-------|
| T-FR-0000-01 | Choose stack and scaffold repository | done | done | done | `FR-0000` (manually completed outside ticket workflow) |
| T-FR-0001-01 | Define goals and budgets data contracts | done | done | done | `FR-0001` |
| T-FR-0001-02 | Build goals and budget actuals engine | done | done | done | `FR-0001` (Dockerized test/validation; seeded-month reconciliation covered by integration fixture) |
| T-FR-0001-03 | Add income and liabilities ingestion contracts | done | done | done | `FR-0001` (Dockerized test/validation; seeded CSV ingest + aggregate verification complete) |
| T-FR-0001-04 | Expose unified monthly financial summary API | done | done | done | `FR-0001` (GET `/api/unified-view/summary`; `finance.unified.monthly`; tests + USD 10 reconciliation block) |
| T-FR-0001-05 | Deliver Phase 2 unified dashboard view | done | done | done | `FR-0001` (Unified view page, vitest: alerts + month + contract shape) |
| T-FR-0002-01 | Define budget allocation contracts | done | done | done | `FR-0002`; ORM + Pydantic + cadence/summary in `src/finance/allocation/`; migration stub `phase2_budget_allocation_stub.sql`; `tests/test_allocation_contracts.py` |
| T-FR-0002-02 | Expose budget allocation API | done | done | done | `FR-0002`; `GET/POST/PUT/DELETE /api/budget-allocation/plans`, nested items, `.../summary`; `finance.allocation.service`; `tests/test_api_budget_allocation.py`; `httpx` dependency for TestClient |
| T-FR-0002-03 | Sync allocation totals into unified budgets | done | done | done | `FR-0002`; `Budget.allocation_derived`; `finance.allocation.budget_sync`; hooks in `service`; `tests/test_allocation_budget_sync.py` + unified API test |
| T-FR-0002-04 | Deliver budget entry page | done | done | done | `FR-0002`; `BudgetPage`, nav **Budget**, `api` budget-allocation methods, `lib/budgetAllocation.ts` + vitest, invalidates `unifiedViewSummary` |
| T-FR-0002-05 | Validate and document budget entry workflow | done | done | done | `FR-0002`; [`operator-budget-allocation.md`](feature-history/FR-0002-budget-entry-page/operator-budget-allocation.md), [`90-closeout.md`](feature-history/FR-0002-budget-entry-page/90-closeout.md), [`scripts/README.md`](../scripts/README.md) § Budget allocation validation |
| T-FR-0003-01 | Extract BBD projection as importable module | done | done | done | `FR-0003`; `src/finance/bbd/engine.py` + tests |
| T-FR-0003-02 | Add BBD projection REST API | done | done | done | `FR-0003`; `POST /api/bbd-projection/run` |
| T-FR-0003-03 | Deliver BBD projection page | done | done | done | `FR-0003`; **BBD** nav — `frontend/src/pages/BbdProjectionPage.tsx` |
| T-FR-0003-04 | Validate BBD UX and document operator workflow | done | done | done | `FR-0003`; `scripts/README.md` + pytest / host notes |
| T-FR-0004-01 | BBD bottom control dock and relocated actions | done | done | done | `FR-0004`; dock chrome + Docs label (implemented prior + refined) |
| T-FR-0004-02 | BBD visualization view-model and chart-ready series | done | done | done | `FR-0004`; `frontend/src/lib/bbdVizModel.ts` + vitest |
| T-FR-0004-03 | BBD 2D story dashboard and educational callouts | done | done | done | `FR-0004`; `BbdStoryDashboard.tsx` |
| T-FR-0004-04 | BBD spatial / 3D–time experience (lazy WebGL) | done | done | done | `FR-0004`; `BbdSpatialPanel.tsx`, lazy + reduced-motion |
| T-FR-0004-05 | BBD experience integration VAL and operator docs | done | done | done | `FR-0004`; Docker lint/test, `scripts/README.md` |
| T-FR-0005-01 | Budget page in-app guide, field annotations, and floating dock | done | done | done | `FR-0005`; `BudgetDocsProvider`, `budgetFieldTips`, `BudgetPage` dock — `docker compose run web npm run build` |
| T-FR-0006-01 | Define cash-flow graph persistence contracts | done | done | done | `FR-0006`; `finance.cash_flow_graph` Pydantic contracts + `tests/test_cash_flow_graph_contracts.py` |
| T-FR-0006-02 | Add cash-flow graph migration and ORM models | done | done | done | `FR-0006`; `CashFlowNode`/`CashFlowEdge`, `phase2_cash_flow_graph_stub.sql`, `tests/test_cash_flow_graph_models.py` |
| T-FR-0006-03 | Expose cash-flow graph CRUD API | done | done | done | `FR-0006`; `GET`/`PUT …/cash-flow-graph`; `finance.cash_flow_graph.service`; `tests/test_api_cash_flow_graph.py`; allocation router + `httpx` |
| T-FR-0006-04 | Budget React Flow panel wired to graph API | done | done | done | `FR-0006`; `@xyflow/react`, `CashFlowGraphPanel`, `cashFlowGraphFlow` tests; `docker compose run --no-deps web` build + vitest |
| T-FR-0006-05 | Cash-flow time scrub and aggregated views | done | done | done | `FR-0006`; `cashFlowTimeAggregation.ts`, grain UI + table on **`CashFlowGraphPanel`**; Vitest |
| T-FR-0006-06 | BBD-suggested cash-flow edges | done | done | done | `FR-0006`; **`bbdCashFlowSuggestions`**, Budget UI runs BBD default + **Add edge**; Vitest |
| T-FR-0006-07 | Compose default for allocation auto-template | done | done | done | `FR-0006`; `docker-compose.yml` default `false`; `scripts/README.md` + `budget-plans-roadmap.md` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
