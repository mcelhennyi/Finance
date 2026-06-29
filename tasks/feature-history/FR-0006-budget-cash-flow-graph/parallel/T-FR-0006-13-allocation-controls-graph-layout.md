# T-FR-0006-13 - Allocation controls and graph layout cleanup

**Branch:** `feat/FR-0006-budget-cash-flow-graph--T-FR-0006-13-allocation-controls-graph-layout`  
**Worktree:** `.worktrees/FR-0006-budget-cash-flow-graph/T-FR-0006-13-allocation-controls-graph-layout/`  
**Status:** TEST/DEV/VAL done

## 2026-06-29

### TEST

- Added frontend coverage for the single-account allocation role mapping:
  - `source` stores selected account in `to_account_ref`.
  - `sink` stores selected account in `from_account_ref`.
- Added graph-flow coverage for pure source/sink stacking and right-to-left target approach that does not cross endpoint node bodies.
- Updated allocation cluster tests after removing the endpoint-role filter from the graph expansion UI.
- Updated backend/API seed tests so the auto-template and tracked YAML seed model income as source allocation rows.

### DEV

- Budget allocation add/edit controls now use category dropdowns and a single role-aware account dropdown.
- Removed allocation endpoint dropdowns from the Budget table/editor and removed the graph cluster endpoint filter.
- Removed plan income amount/cadence controls from the Plan section; plan save now persists the name only.
- Removed the approximate Time view from `CashFlowGraphPanel`.
- Stacked pure source nodes left and pure sink nodes right before graph relayout/routing.
- Refined orthogonal routing so edges leave source handles horizontally, approach targets from the left, hard-avoid node/label bodies, and avoid reusing prior line lanes where a full line-avoid route is impossible.
- Converted starter template and tracked seed YAML to use source allocation income rather than plan income.

### VAL

- `docker compose run --rm --no-deps api sh -c "pip install pytest >/tmp/pip-pytest.log && pytest tests/test_api_budget_allocation.py tests/test_seed_budget_allocation_yaml.py tests/test_allocation_contracts.py"` - pass, **40 passed**, one Starlette/httpx deprecation warning.
- `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm test -- budgetAllocation.test.ts cashFlowAllocationClusters.test.ts cashFlowGraphFlow.test.ts"` - pass, **42 passed**.
- `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass, **65** Vitest tests, production build passed with the existing Vite chunk-size warning.
- `git diff --check` - pass.
- `./scripts/check-frontend-no-merge-markers.sh` - pass.
- `mkdocs build --strict` - pass on host; emitted only the upstream Material for MkDocs 2.0 advisory and informational nav messages for docs not in `nav`.
- Browser VAL on local API/Vite at alternate ports:
  - Desktop Budget view: no plan income controls, no approximate Time view, no endpoint controls/filter; category/account dropdowns present; no payment-method select in allocation rows.
  - Desktop graph: pure source nodes (`Income`, `Savings`) stacked left, pure sink (`Checking`) stacked right, and route samples had **0** node-body hits.
  - 390px viewport: same removed-control checks passed, account/category dropdown options remained available, route samples had **0** node-body hits, and browser console errors were empty.
