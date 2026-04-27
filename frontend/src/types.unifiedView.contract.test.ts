import { describe, expect, it } from 'vitest'
import type { UnifiedViewSummary } from './types'

/** Minimal object satisfying the contract (matches FastAPI default snake_case). */
const sample: UnifiedViewSummary = {
  period_month: '2026-04-01',
  as_of: '2026-04-15',
  currency: 'USD',
  budgets: [],
  goals: [],
  card_cash_flow: {
    total_charges: 0,
    total_credits: 0,
    net_spent: 0,
    transaction_count: 0,
    by_category: {},
  },
  contracts: {
    total_income: 0,
    total_liabilities: 0,
    net_cash_after_liabilities: 0,
    active_income_count: 0,
    active_liability_count: 0,
  },
  net_worth: {
    assets_total: 0,
    assets_tracked: false,
    liabilities_total: 0,
    net_worth: 0,
    liability_line_items: [],
  },
  reconciliation: {
    unified_operating_net: 0,
    independent_operating_net: 0,
    discrepancy: 0,
    within_tolerance: true,
    income_aggregate_vs_line_items: 0,
    within_tolerance_income: true,
  },
}

describe('UnifiedViewSummary contract', () => {
  it('parses the empty response shape the dashboard expects', () => {
    expect(sample.period_month).toBe('2026-04-01')
    expect(sample.reconciliation.within_tolerance).toBe(true)
  })
})
