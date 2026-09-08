## 2026-06-29 (T-FR-0006-09) - directional handles and double-click linking

**Stage:** TEST/DEV/VAL on **`feat/FR-0006-budget-cash-flow-graph`**

**Recap (plain English):** Completed directional account linking in the Budget cash-flow map. Account nodes now render left input handles and right output handles, derive visible role badges from incoming/outgoing edge incidence, and support double-click output -> input linking through the existing save-before-link API path. The existing select/button fallback remains and shares the same validation for pending, completed, duplicate, and self-link states.

**Validation:** `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test -- cashFlowGraphFlow.test.ts && npm run build"` passed. Browser VAL on **Budget -> Cash flow map** loaded the May 2026 example plan, confirmed 8 rendered nodes with left/right handles, role labels, handle heights above 24px at desktop and 390px phone width, no console errors, a successful double-click link from **Sapphire (Ian)** to **Freedom (Natalie)**, and visible fallback errors for duplicate and self-links.

**Notes:** A phone-width page-level horizontal overflow signal is present from existing app chrome/tooltips and React Flow transformed internals; the new account-link fallback controls were not the source.
