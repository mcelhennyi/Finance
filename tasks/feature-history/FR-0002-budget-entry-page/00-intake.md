# FR-0002 — Intake

| Field | Value |
|------|--------|
| **Title** | Budget entry page |
| **Requester** (optional) | User request, 2026-04-30 |
| **Target timeline** (optional) | Next Phase 2 feature after unified view |
| **Constraints** | Manual entry first; reuse the existing FastAPI + React architecture; integrate with completed Phase 2 budget and unified-view contracts; sample spreadsheet is content evidence only, not product language or UI design authority; keep feature artifacts and global ticket trackers synchronized |
| **Success definition** (1-3 bullets) | 1) Users can manually enter recurring budget allocation items with category, amount, cadence, payment method, timing, and notes. 2) Finance Hub derives monthly allocation totals and category budgets from those entries. 3) The unified monthly view reflects entered budget allocations through existing variance behavior. |
| **Out of scope** | HTML/CSV spreadsheet import; copying the sample spreadsheet's wording, layout, or visual design; Phase 3 projections/scenarios; payment scheduling automation; live bill-pay integrations |
| **Links** | `docs/design/system-overview.md`, `docs/design/services/goals-service/overview.md`, `tasks/feature-history/FR-0001-phase2-goals-unified-view/tickets.md` |

**Raw details** (prose the user or PM provided):

"/feature-request Create a budget entry page that will allow data such as :file:///Users/ianmcelhenny/Downloads/Rental%20Plan/Monthly%20Allocation.html to be entered. Expand/add other features as required based on the current feature/plans"

Clarification:

The sample document should be used for content only. It is not a source for design language, UI copy, layout, or visual treatment.
