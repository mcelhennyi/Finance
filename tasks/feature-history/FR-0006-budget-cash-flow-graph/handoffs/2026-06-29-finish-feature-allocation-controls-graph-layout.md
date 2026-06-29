# Handoff - finish-feature FR-0006 allocation controls and graph layout (2026-06-29)

### Executive summary

- **Integration line:** `feat/FR-0006-budget-cash-flow-graph` is feature-complete for **`T-FR-0006-01`** through **`T-FR-0006-13`** after the final post-closeout allocation-controls/graph-layout expansion.
- **PR:** [#9](https://github.com/mcelhennyi/Finance/pull/9) remains open with base **`master`** and head **`feat/FR-0006-budget-cash-flow-graph`**.
- **Closeout:** [`90-closeout.md`](../90-closeout.md), [`DIARY.md`](../DIARY.md), [`README.md`](../README.md), [`REGISTRY.md`](../../REGISTRY.md), and [`tasks/ticket-progress.md`](../../../ticket-progress.md) are updated for the restored feature-complete gate.

### What changed after the prior closeout

- `frontend/src/pages/BudgetPage.tsx` now exposes configured category dropdowns and one role-aware allocation account dropdown; source rows map to `to_account_ref`, sink rows map to `from_account_ref`.
- Plan income controls, allocation endpoint dropdowns/filtering, allocation payment-method selection, and the approximate Time view were removed from the user-facing Budget experience.
- `frontend/src/lib/cashFlowGraphFlow.ts` stacks pure source nodes on the left and pure sink nodes on the right before relayout/routing.
- `frontend/src/lib/cashFlowGraphRouting.ts` routes out of source handles and into target handles without passing behind endpoint node bodies.
- Starter allocation templates and tracked YAML now model income as a source allocation row.

### Validation

- Backend ticket gate: `docker compose run --rm --no-deps api sh -c "pip install pytest >/tmp/pip-pytest.log && pytest tests/test_api_budget_allocation.py tests/test_seed_budget_allocation_yaml.py tests/test_allocation_contracts.py"` - pass, **40** tests, one existing Starlette/httpx warning.
- Focused frontend gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm test -- budgetAllocation.test.ts cashFlowAllocationClusters.test.ts cashFlowGraphFlow.test.ts"` - pass, **42** tests.
- Full frontend gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass, **65** tests, existing Vite chunk-size warning.
- Docs/tooling: `git diff --check`, `./scripts/check-frontend-no-merge-markers.sh`, and host `mkdocs build --strict` passed. MkDocs emitted only the upstream Material for MkDocs 2.0 advisory and existing nav notices.
- Browser: Budget allocation page inspected at desktop and **390px** viewport. The checks confirmed removed income/time/endpoint/payment controls, category/account dropdowns, source/sink stacking, **0** sampled route/node-body hits, and no console errors.

### Suggested next step

Review PR **#9** and merge **`feat/FR-0006-budget-cash-flow-graph`** to **`master`** when satisfied. After merge, remove repo-root **`CURRENT.md`** from the default branch.

### Options

- **A. Merge now:** The feature-complete branch includes all FR-0006 tickets through the allocation-controls cleanup and has passed ticket validation.
- **B. Request changes:** Use this if review finds a blocking Budget allocation workflow or graph readability issue.
- **C. Follow-up FR:** Track broader graph layout-engine work, mobile app-chrome overflow, bundle-size/code-splitting, or Docker docs-service wiring separately.
