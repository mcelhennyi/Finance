## 2026-06-29 (T-FR-0006-12) - edge and label deconfliction started

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph--T-FR-0006-12-edge-label-deconfliction`**

**Recap (plain English):** Completed a post-closeout FR-0006 expansion for edge and label deconfliction. The route helper now reserves label boxes and prior route segment boxes, returns `labelPosition` / `labelBox` metadata, keeps labels clear of source/target nodes, and searches farther away from dense corridors. The custom Budget graph edge renderer uses route-provided fixed-width label positions instead of centering labels on the route midpoint.

**Validation:** `docker compose run --rm --no-deps -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` passed (**21** focused tests, existing Vite chunk-size warning). Full frontend lint/test/build passed (**62** tests). `git diff --check`, `./scripts/check-frontend-no-merge-markers.sh`, and host `mkdocs build --strict` passed. Browser VAL on the saved example Budget graph passed at desktop and **390px**: **8** labels, **8** nodes, **16** edge paths, **0** label-label, label-node, or label-path collisions.
