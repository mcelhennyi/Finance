## 2026-06-29 (T-FR-0006-11) - expandable allocation clusters with filters and counts

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Completed display-only allocation clusters for the Budget cash-flow map. Account nodes now show linked allocation counts at all times with source/sink splits. Operators can expand one account at a time, filter linked allocations, and inspect source/sink mini-nodes derived from `AllocationItem` rows. The graph relayout/routing path uses the existing `relayoutCashFlowNodes` / `applyOrthogonalEdgeRoutes` helper APIs with a cluster obstacle box instead of a second routing path.

**Implementation notes:**

- Added `cashFlowAllocationClusters` helper coverage for account totals, visible filter counts, endpoint-role filtering, source/sink mini-node labels, empty expansion, owned-destination sink totals, and cluster obstacle relayout.
- Updated `CashFlowGraphPanel` to receive allocation items, derive account clusters from `from_account_ref` / `to_account_ref`, render account badges, show expanded filter controls, add derived allocation mini-nodes, and reroute around the expanded cluster.
- Updated `BudgetPage` allocation line add/edit/read-only surfaces for `allocation_role`, `from_account_ref`, `to_account_ref`, and `counterparty`.
- Updated `docs/design/budget-plans-roadmap.md` and `scripts/README.md` for the FR-0006 allocation-cluster workflow and validation command.

**Validation:**

- Focused tests: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm test -- cashFlowAllocationClusters.test.ts cashFlowGraphFlow.test.ts budgetAllocation.test.ts"` passed (35 tests).
- Required frontend gate: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` passed (11 files / 58 tests; Vite emitted the existing large chunk warning).
- Browser VAL: started `./scripts/dev.sh`, loaded Budget -> May 2026 example plan -> Cash flow map and Allocation lines. Added three local dev DB rows only for validation: `VAL Paycheck deposit` (`source`, `to_account_ref=checking`), `VAL Savings sweep` (`sink`, `checking -> savings` owned destination), and `VAL Amazon order` (`sink`, `ian_chase_sapphire -> external`). Desktop rendered account count badges, checking expansion, source/owned totals, endpoint-role filter changing `2/2` to `1/2`, Sapphire/Amazon external sink expansion, empty brokerage expansion, no graph-node overlaps, and no console errors. Phone viewport `390x844` rendered the same expanded state with no graph-node overlaps and no console errors.
- Browser VAL exception: page-level horizontal overflow at `390px` is still present from existing app header/navigation and inactive tooltip spans (also consistent with prior ticket notes); the new cluster/filter graph state itself was nonblank, text-visible, and overlap-free.
- Docs validation: attempted `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "mkdocs build --strict"`; blocked because the API image does not include `mkdocs`.

**Next:** FR-0006 is ready for `/finish-feature` review/closeout once the parent orchestrator confirms no concurrent stream has added new work.
