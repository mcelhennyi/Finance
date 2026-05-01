# Current branch state

| Field | Value |
|------|--------|
| **FR** | FR-0002 |
| **Feature folder** | `tasks/feature-history/FR-0002-budget-entry-page/` |
| **This branch** | `feat/FR-0002-budget-entry-page--T-FR-0002-01-define-budget-allocation-contracts` |
| **Parent branch** | `feat/FR-0002-budget-entry-page` |
| **Ticket** | `T-FR-0002-01` — Define budget allocation contracts |
| **Last meaningful update** | 2026-04-30 |

## What is on this branch

- Pydantic contracts for allocation plans/items and derived summary shapes (`src/api/schemas.py`).
- Domain enums and monthly normalization (`src/finance/budget_allocation/`).
- ORM models `BudgetAllocationPlan` / `BudgetAllocationItem` (`src/finance/db/models.py`).
- SQL stub aligned with ORM (`src/finance/db/migrations/phase2_budget_allocation_stub.sql`).
- Tests: `tests/test_budget_allocation_contracts.py`.

## In flight / blockers

- None. VAL complete; open PR into feature branch.

## Next

1. Merge PR into `feat/FR-0002-budget-entry-page` when reviewed.
2. Follow-on: `T-FR-0002-02` (allocation API).
