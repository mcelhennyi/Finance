import { describe, expect, it } from 'vitest'

import type { CashFlowGraphDocument } from '../types'

import { coverageAccountLabelFromGraph, planMoneyFlowPhrases } from './budgetPlanMoneyFlows'

describe('planMoneyFlowPhrases', () => {
  it('splits seeded-style edges into inflows and outflows', () => {
    const doc: CashFlowGraphDocument = {
      plan_id: 1,
      nodes: [
        { ref: 'payroll', display_name: 'Payroll', kind: 'income_source', institution: null, layout_x: 0, layout_y: 0 },
        { ref: 'checking', display_name: 'Checking', kind: 'checking', institution: null, layout_x: 0, layout_y: 0 },
        { ref: 'savings', display_name: 'Savings', kind: 'savings', institution: null, layout_x: 0, layout_y: 0 },
        { ref: 'chase', display_name: 'Chase', kind: 'liability_surrogate', institution: null, layout_x: 0, layout_y: 0 },
        { ref: 'brokerage', display_name: 'Brokerage', kind: 'brokerage_cash', institution: null, layout_x: 0, layout_y: 0 },
      ],
      edges: [
        {
          ref: 'a',
          from_ref: 'payroll',
          to_ref: 'checking',
          label: '',
          amount_rule: 'percent_of_inflow',
          fixed_amount: null,
          percent_of_inflow: '100',
          cadence: 'monthly',
          day_of_month: null,
        },
        {
          ref: 'b',
          from_ref: 'savings',
          to_ref: 'checking',
          label: '',
          amount_rule: 'fixed',
          fixed_amount: '1',
          percent_of_inflow: null,
          cadence: 'monthly',
          day_of_month: null,
        },
        {
          ref: 'c',
          from_ref: 'checking',
          to_ref: 'chase',
          label: '',
          amount_rule: 'fixed',
          fixed_amount: '1',
          percent_of_inflow: null,
          cadence: 'monthly',
          day_of_month: null,
        },
        {
          ref: 'd',
          from_ref: 'checking',
          to_ref: 'brokerage',
          label: '',
          amount_rule: 'fixed',
          fixed_amount: '1',
          percent_of_inflow: null,
          cadence: 'monthly',
          day_of_month: null,
        },
      ],
    }
    const { inflows, outflows } = planMoneyFlowPhrases(doc)
    expect(inflows).toEqual(['Payroll → Checking', 'Savings → Checking'])
    expect(outflows).toEqual(['Checking → Chase', 'Checking → Brokerage'])
  })
})

describe('coverageAccountLabelFromGraph', () => {
  it('uses graph display names when refs match', () => {
    const doc: CashFlowGraphDocument = {
      plan_id: 1,
      nodes: [
        { ref: 'checking', display_name: 'Primary checking', kind: 'checking', institution: null, layout_x: 0, layout_y: 0 },
        { ref: 'chase', display_name: 'Chase card', kind: 'liability_surrogate', institution: null, layout_x: 0, layout_y: 0 },
      ],
      edges: [],
    }
    expect(coverageAccountLabelFromGraph('cash', doc)).toBe('Primary checking')
    expect(coverageAccountLabelFromGraph('credit', doc)).toBe('Chase card')
  })
})
