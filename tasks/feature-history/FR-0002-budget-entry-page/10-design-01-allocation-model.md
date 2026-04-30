# FR-0002 — Allocation model and UX notes

## Source-content interpretation

The sample file demonstrates the kind of household planning content Finance Hub should support:

- Recurring planned expenses grouped by category.
- Different cadences, including weekly, monthly, yearly, and twice-monthly items.
- A distinction between cash-funded obligations and credit-card-funded obligations.
- Optional payment timing, such as a day of month when an obligation is expected.
- Notes attached to individual allocation items.
- Income assumptions used to estimate remaining income after planned allocations.

This interpretation does not import the sample's visual design, wording, labels, colors, or spreadsheet structure.

## Domain contracts

### Allocation plan

An allocation plan represents one planning month. The first implementation should create one default plan per `period_month`, with room for named alternatives later.

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | Stable database identity |
| `name` | string | Human label, defaulted from month if omitted |
| `period_month` | date | Normalized to the first day of the month |
| `currency` | string | Default `USD` |
| `income_amount` | decimal or null | Optional income assumption |
| `income_cadence` | enum or null | `weekly`, `biweekly`, `twice_monthly`, `monthly`, `yearly` |
| `created_at` / `updated_at` | datetime | Audit timestamps |

### Allocation item

An allocation item is a planned recurring obligation or contribution within a plan.

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | Stable database identity |
| `plan_id` | integer | Parent allocation plan |
| `item_name` | string | User-entered label |
| `category` | string | Category used to derive aggregate budget rows |
| `planned_amount` | decimal | Amount at the entered cadence |
| `cadence` | enum | `weekly`, `biweekly`, `twice_monthly`, `monthly`, `quarterly`, `yearly` |
| `monthly_amount` | decimal | Derived server-side from amount and cadence |
| `payment_method` | enum/string | First cut supports `cash` and `credit`; leave room for user-defined labels later |
| `due_day` | integer or null | Day of month, 1-31, optional |
| `notes` | string | Optional user notes |
| `sort_order` | integer | Preserves stable row ordering |

## Cadence normalization

Monthly equivalents should be deterministic and documented:

| Cadence | Monthly equivalent |
|---------|--------------------|
| `weekly` | amount x 4 |
| `biweekly` | amount x 2 |
| `twice_monthly` | amount x 2 |
| `monthly` | amount |
| `quarterly` | amount / 3 |
| `yearly` | amount / 12 |

This mirrors common monthly planning practice rather than strict calendar-day accrual. A later projection feature can add calendar-accurate schedules if needed.

## Derived totals

The summary endpoint should return:

- `total_monthly_allocated`: sum of item monthly amounts.
- `cash_allocated`: sum of item monthly amounts where payment method is cash.
- `credit_allocated`: sum of item monthly amounts where payment method is credit.
- `remaining_income`: monthly income assumption minus total monthly allocated, when an income assumption exists.
- `timing_sensitive_cash`: cash allocation total for items with due days before a configurable cutoff. The first cut can default the cutoff to day 17 and expose it as a request/query parameter.
- `category_totals`: monthly totals grouped by category.
- `cadence_totals`: monthly totals grouped by entered cadence.

## Integration with existing budgets

FR-0001 already introduced `Budget` rows consumed by the budget actuals engine and unified monthly summary. FR-0002 should derive category-level monthly budgets from allocation items and synchronize them into that existing budget contract.

Rules:

- One derived `Budget` row per category and period month should represent the current allocation total.
- Re-saving an allocation plan should update derived category budgets idempotently.
- Manual aggregate `Budget` rows, if any exist for the same category/month, need a deterministic conflict rule before implementation. The recommended first-cut rule is "allocation-derived budgets own the category/month for plans created through the Budget page."
- The unified summary should not know about UI row details. It should continue consuming category budget contracts and transaction actuals.

## UX contract

The page should use Finance Hub's existing dashboard language and Tailwind card/table patterns:

- Month selector and plan summary at the top.
- Editable allocation table for item name, category, amount, cadence, payment method, due day, and notes.
- Add, save, delete, loading, empty, and error states consistent with `ParametersPage`.
- Summary cards for total monthly allocation, cash allocation, credit allocation, and remaining income.
- Navigation entry named for the product concept, not copied from the sample document.

## Follow-up candidates

- Spreadsheet import into draft allocation rows.
- Multiple named scenarios for the same month.
- Persisted alert history for over-budget categories.
- Calendar-accurate due-date scheduling and cash timing projections.
