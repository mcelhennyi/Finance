# FR-0006 closeout - Budget cash-flow graph

**PR pending:** [**#9**](https://github.com/mcelhennyi/Finance/pull/9) -> **`master`**. Closeout drafted 2026-06-29 during **`/finish-feature`**; refresh this line with the merge SHA after human merge.

## Executive summary

FR-0006 ships the Budget cash-flow graph as a persisted, editable, data-driven surface. The completed feature includes graph contracts, ORM persistence, CRUD APIs, the React Flow Budget panel, time aggregation, explicit BBD suggestions, source/sink allocation primitives with account endpoints, directional account linking, orthogonal routing, expandable allocation clusters with filters and counts, and edge/label deconfliction.

## Delivered surfaces

| Surface | Location |
|---------|----------|
| Graph API and persistence | `src/finance/cash_flow_graph/`, `src/api/routers/budget_allocation.py`, `src/finance/db/models.py` |
| Allocation source/sink contracts | `src/finance/allocation/`, `src/finance/seed_budget_allocation_yaml.py`, `src/api/schemas.py` |
| Budget graph UI | `frontend/src/components/budget/CashFlowGraphPanel.tsx`, `frontend/src/lib/cashFlowGraphFlow.ts` |
| Routing and clusters | `frontend/src/lib/cashFlowGraphRouting.ts`, `frontend/src/lib/cashFlowAllocationClusters.ts` |
| Budget allocation forms | `frontend/src/pages/BudgetPage.tsx`, `frontend/src/lib/budgetAllocation.ts`, `frontend/src/types.ts` |
| Operator/design docs | `docs/design/budget-plans-roadmap.md`, `scripts/README.md` |

## Tickets

| Ticket | Summary | Status |
|--------|---------|--------|
| `T-FR-0006-01` | Define cash-flow graph persistence contracts | TEST / DEV / VAL **done** |
| `T-FR-0006-02` | Add cash-flow graph migration and ORM models | TEST / DEV / VAL **done** |
| `T-FR-0006-03` | Expose cash-flow graph CRUD API | TEST / DEV / VAL **done** |
| `T-FR-0006-04` | Budget React Flow panel wired to graph API | TEST / DEV / VAL **done** |
| `T-FR-0006-05` | Cash-flow time scrub and aggregated views | TEST / DEV / VAL **done** |
| `T-FR-0006-06` | BBD-suggested cash-flow edges | TEST / DEV / VAL **done** |
| `T-FR-0006-07` | Compose default for allocation auto-template | TEST / DEV / VAL **done** |
| `T-FR-0006-08` | Unified source/sink allocation primitive contracts | TEST / DEV / VAL **done** |
| `T-FR-0006-09` | Directional account handles and double-click linking | TEST / DEV / VAL **done** |
| `T-FR-0006-10` | Orthogonal routing and obstacle-aware relayout | TEST / DEV / VAL **done** |
| `T-FR-0006-11` | Expandable allocation clusters with filters and counts | TEST / DEV / VAL **done** |
| `T-FR-0006-12` | Edge and label deconfliction | TEST / DEV / VAL **done** |

## Validation

- `git diff --check` - pass.
- `./scripts/check-frontend-no-merge-markers.sh` - pass.
- `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/ -q"` - pass, **96 passed**, one existing Starlette/httpx warning.
- `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass after T-FR-0006-12, **62 Vitest tests passed**, production build passed with the existing Vite chunk-size warning.
- `DEVELOP_COMPOSE_FILE=docker-compose.yml ./develop build` - blocked because this compose file has no `docs` service; used host docs build as a documented exception.
- `mkdocs build --strict` - pass on host; emitted only the upstream Material for MkDocs 2.0 notice and informational nav messages.
- Browser VAL by ticket agents - Budget -> Cash flow map and Allocation lines inspected on desktop and 390px phone viewport for directional handles, double-click/fallback linking, duplicate/self-link errors, orthogonal routes, allocation counts, filters, source/owned/external sink clusters, no graph-node overlap, and no console errors.
- T-FR-0006-12 ticket gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` - pass, **21** focused tests passed, production build passed with the existing Vite chunk-size warning.
- T-FR-0006-12 Browser VAL - saved example Budget cash-flow map inspected at desktop and **390px** viewport; sampled **8** edge labels, **8** graph nodes, and **16** SVG edge paths with **0** label-label, label-node, or label-path collisions.

## Deferred / follow-up

| Item | Tracking |
|------|----------|
| Existing 390px page-level horizontal overflow from app chrome / inactive tooltip spans; graph states stayed nonblank and overlap-free. | Ticket diaries `parallel/T-FR-0006-09-directional-linking.md` through `parallel/T-FR-0006-11-allocation-clusters.md` |
| Existing Vite large-chunk warning for the current bundle shape. | Future frontend performance/code-splitting follow-up if it becomes a release blocker |
| Docker docs route is not wired for this repo (`./develop build` expects a `docs` service). | Project tooling follow-up; host `mkdocs build --strict` passed |

## Suggested next step

Review and merge PR [**#9**](https://github.com/mcelhennyi/Finance/pull/9) when satisfied, then remove repo-root **`CURRENT.md`** from the default branch after merge.

## Options

| Option | When |
|--------|------|
| Merge PR #9 | The reviewer accepts the completed FR-0006 feature slice. |
| Request changes on PR #9 | A reviewer finds a blocking issue in the feature branch. |
| Open follow-up FRs | Non-blocking polish, mobile chrome overflow, or bundle-size work should be tracked after merge. |

## Audit

- **Merge commit:** *pending human merge*
- **Feature branch:** `feat/FR-0006-budget-cash-flow-graph` (retained on remote)
- **Pull request:** [#9](https://github.com/mcelhennyi/Finance/pull/9)
- **Handoff:** [`handoffs/2026-06-29-finish-feature-edge-label-deconfliction.md`](handoffs/2026-06-29-finish-feature-edge-label-deconfliction.md)
