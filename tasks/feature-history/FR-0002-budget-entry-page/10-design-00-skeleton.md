# FR-0002 — Design (level 0, skeleton)

## Purpose

Provide a manual entry surface for planned recurring budget allocations, then make those entries available to Finance Hub's existing budget actuals and unified monthly view behavior.

The provided spreadsheet sample is used only to understand required data and calculations. Finance Hub will use its own product language, information architecture, and visual design.

## Actors

- End user entering planned monthly allocations
- Goals service module
- Unified monthly summary adapter
- Existing transaction and analysis modules
- React dashboard

## Public surfaces (skeleton)

Only contracts are listed here; implementation details are deferred to ticket execution.

| Surface | Kind | Contract (signature / schema sketch) | Owner (logical) |
|---------|------|----------------------------------------|-----------------|
| `BudgetAllocationPlan` | Pydantic / ORM contract | `{id, name, period_month, currency, income_amount?, income_cadence?, created_at, updated_at}` | Goals service |
| `BudgetAllocationItem` | Pydantic / ORM contract | `{id, plan_id, item_name, category, planned_amount, cadence, monthly_amount, payment_method, due_day?, notes, sort_order}` | Goals service |
| `GET /budget-plans` | API route | List allocation plans, optionally filtered by month | Goals API |
| `POST /budget-plans` | API route | Create a plan for a target month | Goals API |
| `PUT /budget-plans/{plan_id}` | API route | Update plan metadata and income assumptions | Goals API |
| `DELETE /budget-plans/{plan_id}` | API route | Delete or archive an allocation plan and its entries | Goals API |
| `GET /budget-plans/{plan_id}/items` | API route | List planned allocation items for one plan | Goals API |
| `POST /budget-plans/{plan_id}/items` | API route | Add an allocation item | Goals API |
| `PUT /budget-plans/{plan_id}/items/{item_id}` | API route | Update one allocation item | Goals API |
| `DELETE /budget-plans/{plan_id}/items/{item_id}` | API route | Remove one allocation item | Goals API |
| `GET /budget-plans/{plan_id}/summary` | API route | Return derived totals by category, cadence, and payment method plus remaining income | Goals API |
| `BudgetPage` | UI contract | Manual allocation editor with editable rows, summary cards, and save/delete feedback | Frontend dashboard |
| `GET /unified-view/summary` | Existing API route | Includes budget variance based on category totals derived from saved allocation entries | Unified view adapter |

## Data in / out

| Input | Output | Storage |
|-------|--------|---------|
| Manual recurring allocation entries, target month, optional income assumptions | Saved allocation items, derived monthly/category totals, budget contracts for variance, unified summary updates | Existing DB plus new allocation plan/item tables and synchronized category `Budget` rows |

## Design decisions (resolved)

- Manual entry ships first; spreadsheet import is out of scope for FR-0002.
- The sample spreadsheet contributes content requirements only. Do not copy its wording, layout, colors, or spreadsheet terminology.
- Itemized allocation entries are first-class so Finance Hub can preserve the user's planning detail while deriving category-level budget rows for the existing actuals engine.
- Cadence normalization belongs in backend domain logic and is tested independently from the UI.
- The unified view remains the read-side dashboard for actual-vs-plan comparison; the new page owns editing planned allocations.

## Open questions

- Whether future imports should accept HTML exports, CSV exports, or both is deferred to a follow-up feature.
- Persisted over-budget alert history remains a broader Phase 2 gap from FR-0001 and is not solved by this editor unless selected as follow-up work.
