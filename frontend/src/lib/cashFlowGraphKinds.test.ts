import { describe, expect, it } from 'vitest'

import { cashNodeKindLabel, cashNodeKindShortLabel, isValidCashFlowRef } from './cashFlowGraphKinds'

describe('cash flow graph kind display', () => {
  it('keeps canonical labels readable', () => {
    expect(cashNodeKindLabel('income_source')).toBe('income source')
    expect(cashNodeKindLabel('liability_surrogate')).toBe('liability surrogate')
  })

  it('uses compact account-table labels for long kinds', () => {
    expect(cashNodeKindShortLabel('income_source')).toBe('Income')
    expect(cashNodeKindShortLabel('brokerage_cash')).toBe('Brokerage')
    expect(cashNodeKindShortLabel('external_pooled')).toBe('External')
    expect(cashNodeKindShortLabel('liability_surrogate')).toBe('Liability')
    expect(cashNodeKindShortLabel('checking')).toBe('checking')
  })
})

describe('cash flow refs', () => {
  it('validates stable plan-local refs', () => {
    expect(isValidCashFlowRef('checking')).toBe(true)
    expect(isValidCashFlowRef('1checking')).toBe(false)
  })
})
