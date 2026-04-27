/**
 * Derived over-budget signals from unified summary budgets (Phase 2).
 * Persisted alert history will be merged when the alerts API exists.
 */

export interface BudgetSummaryRowLike {
  category: string
  is_over_budget: boolean
  trending_over_budget: boolean
  is_incomplete_month: boolean
  variance: number
}

export interface DerivedBudgetSignal {
  category: string
  kind: 'over_budget' | 'trending_over_budget'
  detail: string
}

export function collectDerivedBudgetSignals(budgets: BudgetSummaryRowLike[]): DerivedBudgetSignal[] {
  const out: DerivedBudgetSignal[] = []
  for (const b of budgets) {
    if (b.is_over_budget) {
      out.push({
        category: b.category,
        kind: 'over_budget',
        detail: `Over budget by $${Math.abs(b.variance).toFixed(2)}`,
      })
    } else if (b.trending_over_budget && b.is_incomplete_month) {
      out.push({
        category: b.category,
        kind: 'trending_over_budget',
        detail: 'Pacing over budget for the month so far',
      })
    }
  }
  return out
}
