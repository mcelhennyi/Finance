import { describe, expect, it } from 'vitest'

import {
  allocationItemCreateBody,
  allocationItemPutBody,
  allocationItemUpdateBody,
  dueDayFromInput,
  formatUsd,
  parsePositiveAmount,
  validateItemDraft,
  type ItemDraftInput,
} from './budgetAllocation'

describe('formatUsd', () => {
  it('formats positive and negative amounts', () => {
    expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/)
    expect(formatUsd(-10)).toMatch(/−\$10\.00/)
  })
})

describe('parsePositiveAmount', () => {
  it('accepts valid positive numbers', () => {
    expect(parsePositiveAmount('100')).toBe(100)
    expect(parsePositiveAmount('  0.01 ')).toBe(0.01)
  })

  it('rejects empty and non-positive', () => {
    expect(parsePositiveAmount('')).toBeNull()
    expect(parsePositiveAmount('0')).toBeNull()
    expect(parsePositiveAmount('-5')).toBeNull()
    expect(parsePositiveAmount('x')).toBeNull()
  })
})

describe('dueDayFromInput', () => {
  it('returns undefined for empty', () => {
    expect(dueDayFromInput('')).toBeUndefined()
    expect(dueDayFromInput('  ')).toBeUndefined()
  })

  it('returns day in range', () => {
    expect(dueDayFromInput('15')).toBe(15)
  })

  it('returns undefined out of range', () => {
    expect(dueDayFromInput('0')).toBeUndefined()
    expect(dueDayFromInput('32')).toBeUndefined()
  })
})

describe('validateItemDraft', () => {
  const base: ItemDraftInput = {
    item_name: 'Rent',
    category: 'Housing',
    planned_amount: '2000',
    cadence: 'monthly',
    payment_method: 'cash',
    due_day: '',
    notes: '',
  }

  it('returns null when valid', () => {
    expect(validateItemDraft(base)).toBeNull()
  })

  it('flags missing fields', () => {
    expect(validateItemDraft({ ...base, item_name: '' })).not.toBeNull()
    expect(validateItemDraft({ ...base, category: '  ' })).not.toBeNull()
    expect(validateItemDraft({ ...base, planned_amount: '0' })).not.toBeNull()
  })
})

describe('allocationItemCreateBody', () => {
  it('builds API payload', () => {
    const body = allocationItemCreateBody({
      item_name: 'Groceries',
      category: 'Food',
      planned_amount: '100',
      cadence: 'weekly',
      payment_method: 'credit',
      due_day: '5',
      notes: 'ok',
    })
    expect(body.item_name).toBe('Groceries')
    expect(body.planned_amount).toBe('100')
    expect(body.cadence).toBe('weekly')
    expect(body.allocation_role).toBe('sink')
    expect(body.due_day).toBe(5)
  })

  it('emits source/sink primitive endpoint fields when provided', () => {
    const body = allocationItemCreateBody({
      item_name: 'Paycheck',
      category: 'Income',
      planned_amount: '5000',
      cadence: 'monthly',
      allocation_role: 'source',
      from_account_ref: ' ',
      to_account_ref: ' checking ',
      counterparty: ' Employer ',
      payment_method: 'cash',
      due_day: '',
      notes: '',
    })
    expect(body.allocation_role).toBe('source')
    expect(body.from_account_ref).toBeUndefined()
    expect(body.to_account_ref).toBe('checking')
    expect(body.counterparty).toBe('Employer')
  })
})

describe('allocationItemPutBody', () => {
  it('omits sort_order', () => {
    const body = allocationItemPutBody({
      item_name: 'X',
      category: 'Y',
      planned_amount: '10',
      cadence: 'monthly',
      payment_method: 'cash',
      due_day: '',
      notes: '',
    })
    expect(body.sort_order).toBeUndefined()
    expect(body.planned_amount).toBe('10')
  })
})

describe('allocationItemUpdateBody', () => {
  it('clears endpoint fields with null and emits role changes', () => {
    const body = allocationItemUpdateBody({
      allocation_role: 'sink',
      from_account_ref: ' checking ',
      to_account_ref: '',
      counterparty: '',
    })
    expect(body.allocation_role).toBe('sink')
    expect(body.from_account_ref).toBe('checking')
    expect(body.to_account_ref).toBeNull()
    expect(body.counterparty).toBeNull()
  })
})
