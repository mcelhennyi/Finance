## 2026-06-29 (T-FR-0006-10) - orthogonal routing and obstacle-aware relayout

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Completed deterministic orthogonal routing for the Budget cash-flow map. Edges now render through a custom React Flow edge type backed by `cashFlowGraphRouting`: right-side source anchors, left-side target anchors, stable per-source lane ordering, square SVG paths, obstacle-aware bend/lane selection, and a small relayout helper that accepts future cluster/expanded-account boxes for `T-FR-0006-11`.

**Validation:**

- Frontend gate: `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` passed. The focused suite now has 17 tests, including multiple outgoing lanes, obstacle detour, square path generation, route data attachment, stable lane ordering, and cluster-height relayout.
- Browser VAL: started `./scripts/dev.sh`, loaded Budget -> May 2026 example plan -> cash-flow map. Desktop rendered 8 nodes and 14 route paths before mutation, all orthogonal (`M/L` only), with no detected node overlap and no console errors. Reload preserved route shape. At 390px viewport, the graph rendered 8 nodes and 14 orthogonal paths with no detected node overlap and no console errors.
- Link/create/reload smoke: created a non-duplicate `checking -> savings` account link through the fallback controls; rendered route path count increased to 16, all paths stayed orthogonal, no error alert appeared, and reload preserved 8 nodes / 16 orthogonal paths with no detected node overlap.

**Notes:** The 390px page still reports page-level horizontal overflow from existing app chrome / transformed graph internals, consistent with the `T-FR-0006-09` browser note; the routed graph itself remained nonblank and overlap-free. The link/create smoke intentionally changed the local dev seed database by adding `checking -> savings` with label `VAL routing check`; no source files outside the ticket scope were changed for that data mutation.
