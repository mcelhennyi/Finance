import { describe, expect, it } from 'vitest'
import { collectDerivedBudgetSignals } from './unifiedAlerts'

describe('collectDerivedBudgetSignals', () => {
  it('returns empty when no budgets are stressed', () => {
    expect(
      collectDerivedBudgetSignals([
        {
          category: 'Dining',
          is_over_budget: false,
          trending_over_budget: false,
          is_incomplete_month: true,
          variance: -20,
        },
      ]),
    ).toEqual([])
  })

  it('flags over-budget before trending when both', () => {
    const s = collectDerivedBudgetSignals([
      {
        category: 'Travel',
        is_over_budget: true,
        trending_over_budget: true,
        is_incomplete_month: true,
        variance: 12.5,
      },
    ])
    expect(s).toHaveLength(1)
    expect(s[0].kind).toBe('over_budget')
  })

  it('flags trending for incomplete month when not yet over', () => {
    const s = collectDerivedBudgetSignals([
      {
        category: 'Dining',
        is_over_budget: false,
        trending_over_budget: true,
        is_incomplete_month: true,
        variance: 2,
      },
    ])
    expect(s).toHaveLength(1)
    expect(s[0].kind).toBe('trending_over_budget')
  })
})
