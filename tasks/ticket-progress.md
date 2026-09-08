# Ticket progress

## Current focus

| Field | Value |
|-------|--------|
| **Active ticket** | _None_ |
| **Active phase** | _None_ |
| **Branch / worktree** | **`feat/FR-0006-budget-cash-flow-graph`** / **`.worktrees/FR-0006-budget-cash-flow-graph/feature/`** |
| **Session status** | `complete` |
| **Next agent should** | Review refreshed PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) and merge **`feat/FR-0006-budget-cash-flow-graph`** when satisfied. **`FR-0007`** is design-ready but must not become an active stream until the product owner chooses implementation and its handoff records the FR-0006 integration state. |

### Parallel streams (optional)

Use when **more than one** ticket id or **`FR-NNNN`** is actively developed in parallel. Each stream: own `.worktrees/FR-NNNN-<slug>/...` worktree and feature-prefixed branch; update **only** your **Progress** row for your ticket.

| Stream label | Ticket(s) | `FR-NNNN` (if any) | Branch / worktree | Owner / note |
|----------------|------------|--------------------|-------------------|--------------|
| _None_ | _None_ | _None_ | _None_ | _No active parallel streams_ |

**Completed features** (`REGISTRY.md` -> **`complete`**) are **not** listed in **Parallel streams** - they are closed out with **`90-closeout.md`** in **`tasks/feature-history/FR-NNNN-<slug>/`** (see **`.cursor/skills/feature-request/SKILL.md`** -> **Closeout**). **`FR-0002`** closeout: [`FR-0002-budget-entry-page/90-closeout.md`](feature-history/FR-0002-budget-entry-page/90-closeout.md). **`FR-0003`** closeout: [`FR-0003-bbd-projection-ui/90-closeout.md`](feature-history/FR-0003-bbd-projection-ui/90-closeout.md). **`FR-0004`** closeout: [`FR-0004-bbd-projection-experience/90-closeout.md`](feature-history/FR-0004-bbd-projection-experience/90-closeout.md). **`FR-0006`** closeout: [`FR-0006-budget-cash-flow-graph/90-closeout.md`](feature-history/FR-0006-budget-cash-flow-graph/90-closeout.md).

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
| T-FR-0006-08 | Unified source/sink allocation primitive contracts | done | done | done | `FR-0006` expansion; source/sink allocation role + graph endpoint refs/counterparty; Docker backend target 46 passed; Docker frontend lint/test/build passed |
| T-FR-0006-09 | Directional account handles and double-click linking | done | done | done | `FR-0006` expansion; left=input/right=output handles, node roles, double-click + fallback account linking; Docker frontend gate and browser VAL complete |
| T-FR-0006-10 | Orthogonal routing and obstacle-aware relayout | done | done | done | `FR-0006` expansion; orthogonal edge helper + custom React Flow edge; Docker frontend gate passed; browser VAL desktop/390px + link/create/reload passed |
| T-FR-0006-11 | Expandable allocation clusters with filters and counts | done | done | done | `FR-0006` expansion; account badges, allocation mini-nodes, filters, relayout; Docker frontend gate passed; browser VAL desktop/390px passed with existing app-header horizontal overflow exception |
| T-FR-0006-12 | Edge and label deconfliction | done | done | done | `FR-0006` post-closeout expansion; label-aware routing, source/target label avoidance, fixed-width label rendering, and edge-line reservations; Docker frontend gate + browser desktop/390px collision checks passed |
| T-FR-0006-13 | Allocation controls and graph layout cleanup | done | done | done | `FR-0006` post-closeout expansion; role-aware account/category dropdowns, plan income and Time view removal, starter source seed, source/sink graph stacking, and endpoint-safe route approach; Docker backend focused tests, Docker frontend focused/full gates, docs build, and browser desktop/390px VAL passed |
| T-FR-0006-14 | Responsive Budget tables and full-screen edit forms | done | done | done | `FR-0006` post-closeout expansion; allocation/account tables and mobile cards fit screen width, lower-priority fields collapse, dense edit forms use wide/full-screen modals with local typing drafts; Docker frontend lint/test/build (71 tests) and browser desktop/390px/modal-typing VAL passed with 0 console errors |
| T-FR-0007-01 | Define workspace, ledger, and audit contracts | pending | pending | pending | `FR-0007`; no ticket deps; record FR-0006 integration state before DEV |
| T-FR-0007-02 | Install migrations and backfill the Personal workspace | pending | pending | pending | `FR-0007`; deps `T-FR-0007-01` |
| T-FR-0007-03 | Enforce workspace isolation across existing finance surfaces | pending | pending | pending | `FR-0007`; deps `T-FR-0007-02` |
| T-FR-0007-04 | Import and reconcile business accounts and cards | pending | pending | pending | `FR-0007`; deps `T-FR-0007-03` |
| T-FR-0007-05 | Classify business income, expenses, and owner activity | pending | pending | pending | `FR-0007`; deps `T-FR-0007-04` |
| T-FR-0007-06 | Store receipts and review deduction candidates | pending | pending | pending | `FR-0007`; deps `T-FR-0007-05` |
| T-FR-0007-07 | Plan tax obligations and reserve targets | pending | pending | pending | `FR-0007`; deps `T-FR-0007-05` |
| T-FR-0007-08 | Track reserved cash and tax payments | pending | pending | pending | `FR-0007`; deps `T-FR-0007-04`, `T-FR-0007-07` |
| T-FR-0007-09 | Expose business summaries, reports, and exports | pending | pending | pending | `FR-0007`; deps `T-FR-0007-05`, `T-FR-0007-06`, `T-FR-0007-08` |
| T-FR-0007-10 | Deliver the addressable Business workspace shell | pending | pending | pending | `FR-0007`; deps `T-FR-0007-03` |
| T-FR-0007-11 | Deliver business books and deduction workflows | pending | pending | pending | `FR-0007`; deps `T-FR-0007-05`, `T-FR-0007-06`, `T-FR-0007-10` |
| T-FR-0007-12 | Deliver Tax Center and reports workflows | pending | pending | pending | `FR-0007`; deps `T-FR-0007-08`, `T-FR-0007-09`, `T-FR-0007-10` |
| T-FR-0007-13 | Validate the business-finance lifecycle and operator guidance | pending | pending | pending | `FR-0007`; deps `T-FR-0007-11`, `T-FR-0007-12` |

---

## How to choose next work

1. Prefer the **smallest incomplete ticket** whose **Deps** are all **VAL** = `done`.
2. If **Session status** is `blocked`, resolve the blocker before starting new parallel batches.
