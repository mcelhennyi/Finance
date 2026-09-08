/** Persist Budget page month + selected plan in sessionStorage for reload/navigation. */

import { thisMonthYm } from './monthRange'

export const BUDGET_PAGE_PREFS_KEY = 'financeHub.budgetPage'

export type BudgetPagePrefs = {
  ym: string
  planId: number | null
}

export function loadBudgetPagePrefs(): BudgetPagePrefs {
  try {
    const raw = sessionStorage.getItem(BUDGET_PAGE_PREFS_KEY)
    if (!raw) {
      return { ym: thisMonthYm(), planId: null }
    }
    const j = JSON.parse(raw) as { ym?: unknown; planId?: unknown }
    const ym =
      typeof j.ym === 'string' && /^\d{4}-\d{2}$/.test(j.ym) ? j.ym : thisMonthYm()
    const planId =
      typeof j.planId === 'number' && Number.isFinite(j.planId) ? j.planId : null
    return { ym, planId }
  } catch {
    return { ym: thisMonthYm(), planId: null }
  }
}

export function persistBudgetPagePrefs(prefs: BudgetPagePrefs): void {
  try {
    sessionStorage.setItem(BUDGET_PAGE_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode / quota — ignore
  }
}
