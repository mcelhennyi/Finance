/**
 * Inline hover copy for Budget allocation page labels — use with `OutputHoverTip`.
 */

export const BUDGET_FIELD_TIPS = {
  month: 'Calendar month for this allocation plan. Plans are stored per month; switch months to edit a different period.',
  planSelect:
    'When more than one plan exists for the month, pick which plan’s lines and summary you are editing.',
  planName: 'Friendly label for this plan. Does not affect math — helps when you keep multiple drafts.',
  incomeAmount:
    'Optional modeled income for this plan. Used with cadence to compute remaining income in the summary when both are set.',
  incomeCadence: 'How often the income amount repeats (weekly, biweekly, etc.). Must be set together with amount or cleared together.',
  kpi: {
    totalAllocated: 'Sum of normalized monthly amounts across all allocation lines for this plan.',
    cash: 'Portion of allocated monthly spend modeled as cash / checking outflows.',
    credit: 'Portion modeled as credit-card style spending.',
    remainingIncome:
      'Income minus total allocated monthly amount, when plan income is configured. Otherwise shown as unavailable.',
  },
  columns: {
    item: 'Free-text name for this budget line (rent, groceries, subscription bundle, etc.).',
    category: 'Category label — rolls up into unified view budgets when synced.',
    planned: 'Nominal amount at the line’s cadence before normalization to monthly.',
    cadence: 'How often the planned amount repeats. The table shows the equivalent monthly amount.',
    monthly: 'Normalized monthly USD used for totals and unified sync.',
    pay: 'Cash vs credit models how the outflow is categorized for cash/credit KPIs.',
    due: 'Optional calendar day for recurring bills — useful when scheduling; not used for the retired timing-cutoff KPI.',
    notes: 'Optional reminder text; not used in calculations.',
  },
} as const
