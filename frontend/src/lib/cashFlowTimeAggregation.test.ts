import { describe, expect, it } from 'vitest'

import type { CashFlowEdgeSpec, CashFlowGraphDocument } from '../types'

import {
  aggregateNodeFlows,
  edgeMonthlyEquivalentUsd,
  scaleMonthlyToGrain,
} from './cashFlowTimeAggregation'

const baseDoc = (edges: CashFlowEdgeSpec[]): CashFlowGraphDocument => ({
  plan_id: 1,
  nodes: [
    {
      ref: 'a',
      display_name: 'A',
      kind: 'checking',
      institution: null,
      layout_x: 0,
      layout_y: 0,
    },
    {
      ref: 'b',
      display_name: 'B',
      kind: 'savings',
      institution: null,
      layout_x: 0,
      layout_y: 0,
    },
  ],
  edges,
})

describe('cashFlowTimeAggregation', () => {
  it('empty graph yields zero totals', () => {
    const doc = baseDoc([])
    const r = aggregateNodeFlows(doc, 'month', { planIncomeMonthly: 5000 })
    expect(r.a.net).toBe(0)
    expect(r.b.net).toBe(0)
  })

  it('fixed monthly edge splits inflow/outflow', () => {
    const e: CashFlowEdgeSpec = {
      ref: 'e1',
      from_ref: 'a',
      to_ref: 'b',
      label: '',
      amount_rule: 'fixed',
      fixed_amount: '1200',
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    }
    const doc = baseDoc([e])
    const r = aggregateNodeFlows(doc, 'month', { planIncomeMonthly: null })
    expect(r.a.outflow).toBe(1200)
    expect(r.b.inflow).toBe(1200)
    expect(r.a.net).toBe(-1200)
    expect(r.b.net).toBe(1200)
  })

  it('percent_of_inflow uses plan income', () => {
    const e: CashFlowEdgeSpec = {
      ref: 'e1',
      from_ref: 'a',
      to_ref: 'b',
      label: '',
      amount_rule: 'percent_of_inflow',
      fixed_amount: null,
      percent_of_inflow: '10',
      cadence: 'monthly',
      day_of_month: null,
    }
    const monthly = edgeMonthlyEquivalentUsd(e, { planIncomeMonthly: 8000 })
    expect(monthly).toBeCloseTo(800, 5)
  })

  it('year grain scales monthly', () => {
    expect(scaleMonthlyToGrain(100, 'year')).toBe(1200)
    expect(scaleMonthlyToGrain(100, 'day')).toBeCloseTo(100 / 30, 5)
  })

  it('remainder amounts do not add to aggregation totals', () => {
    const e: CashFlowEdgeSpec = {
      ref: 'e1',
      from_ref: 'a',
      to_ref: 'b',
      label: '',
      amount_rule: 'remainder',
      fixed_amount: null,
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    }
    const doc = baseDoc([e])
    const r = aggregateNodeFlows(doc, 'month', { planIncomeMonthly: 5000 })
    expect(r.a.net).toBe(0)
    expect(r.b.net).toBe(0)
  })
})
