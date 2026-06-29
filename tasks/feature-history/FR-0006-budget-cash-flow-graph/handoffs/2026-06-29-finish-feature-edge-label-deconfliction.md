# Handoff - finish-feature FR-0006 edge/label deconfliction (2026-06-29)

### Executive summary

- **Integration line:** `feat/FR-0006-budget-cash-flow-graph` is feature-complete for **`T-FR-0006-01`** through **`T-FR-0006-12`** after the post-closeout edge/label deconfliction expansion.
- **PR:** [#9](https://github.com/mcelhennyi/Finance/pull/9) remains open with base **`master`** and head **`feat/FR-0006-budget-cash-flow-graph`**.
- **Closeout:** [`90-closeout.md`](../90-closeout.md), [`DIARY.md`](../DIARY.md), [`README.md`](../README.md), [`REGISTRY.md`](../../REGISTRY.md), and [`tasks/ticket-progress.md`](../../../ticket-progress.md) are updated for the restored feature-complete gate.

### What changed after the prior closeout

- `frontend/src/lib/cashFlowGraphRouting.ts` now emits `labelPosition` / `labelBox`, reserves prior line boxes and label boxes, keeps labels clear of their own source/target nodes, and expands candidate placement away from dense corridors.
- `frontend/src/components/budget/CashFlowGraphPanel.tsx` renders route-positioned, fixed-width, truncated edge labels.
- `frontend/src/lib/cashFlowGraphFlow.test.ts` covers label obstacle avoidance, source/target node avoidance, label-label deconfliction, prior-line reservation, and route label data.

### Validation

- Ticket frontend gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` - pass, **21** focused tests, existing Vite chunk-size warning.
- Full frontend gate: `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` - pass, **62** tests, existing Vite chunk-size warning.
- Browser: Budget saved example cash-flow map inspected at desktop and **390px** viewport. The geometry sampler found **8** labels, **8** nodes, **16** edge paths, and **0** label-label, label-node, or label-path collisions in both viewports.
- Docs/tooling: `git diff --check`, `./scripts/check-frontend-no-merge-markers.sh`, and host `mkdocs build --strict` passed. Docker docs route remains unavailable because this compose file has no `docs` service.

### Suggested next step

Review PR **#9** and merge **`feat/FR-0006-budget-cash-flow-graph`** to **`master`** when satisfied. After merge, remove repo-root **`CURRENT.md`** from the default branch.

### Options

- **A. Merge now:** The feature-complete branch includes the deconfliction expansion and has passed ticket validation.
- **B. Request changes:** Use this if review finds a blocking graph readability issue in a representative cash-flow map.
- **C. Follow-up FR:** Track broader graph layout-engine work, mobile app-chrome overflow, bundle-size/code-splitting, or Docker docs-service wiring separately.
