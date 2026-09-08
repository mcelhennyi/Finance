import { describe, expect, it } from 'vitest'

import type { BbdRunResponse } from '../types'

import { suggestedEdgesFromBbdResponse } from './bbdCashFlowSuggestions'

const minimalResponse = (patch: Partial<BbdRunResponse['schedule'][0]>): BbdRunResponse => ({
  schedule: [
    {
      year: 1,
      age: 40,
      w2_income: 0,
      rental_net_cash_flow: 0,
      portfolio_dividends: 12000,
      drawdown_borrowed: 6000,
      taxes_paid: 0,
      living_expenses: 0,
      gross_cash_income: 240000,
      taxes_delta_yoy: null,
      gross_income_delta_yoy: null,
      portfolio_value: 1,
      portfolio_basis: 1,
      portfolio_unrealized_gain: 0,
      properties_value: 0,
      properties_mortgage_balance: 0,
      pe_value: 0,
      pe_basis: 0,
      pe_exited_this_year: false,
      sbloc_balance: 0,
      heloc_refi_balance: 0,
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      sbloc_capacity_remaining: 0,
      sbloc_ltv: 0,
      margin_call: false,
      sofr: 0,
      sbloc_rate: 0,
      ...patch,
    },
  ],
  estate_sell_path: {
    label: 'sell',
    gross_estate: 0,
    debt_to_repay: 0,
    cap_gains_tax: 0,
    depreciation_recapture_tax: 0,
    net_to_heirs: 0,
  },
  estate_bbd_path: {
    label: 'bbd',
    gross_estate: 0,
    debt_to_repay: 0,
    cap_gains_tax: 0,
    depreciation_recapture_tax: 0,
    net_to_heirs: 0,
  },
  bbd_net_advantage_vs_sell_path: 0,
  monte_carlo: null,
})

describe('bbdCashFlowSuggestions', () => {
  it('returns empty when no nodes', () => {
    const r = suggestedEdgesFromBbdResponse(minimalResponse({}), [])
    expect(r.edges).toHaveLength(0)
  })

  it('maps dividends portfolio→checking when kinds exist', () => {
    const nodes = [
      {
        ref: 'brk',
        display_name: 'Brokerage',
        kind: 'brokerage_cash' as const,
        institution: null,
        layout_x: null,
        layout_y: null,
      },
      {
        ref: 'chk',
        display_name: 'Checking',
        kind: 'checking' as const,
        institution: null,
        layout_x: null,
        layout_y: null,
      },
    ]
    const res = suggestedEdgesFromBbdResponse(minimalResponse({ portfolio_dividends: 12000 }), nodes)
    expect(res.edges.some(e => e.from_ref === 'brk' && e.to_ref === 'chk')).toBe(true)
    expect(res.edges.find(e => e.from_ref === 'brk')?.fixed_amount).toBe((1000).toFixed(2))
  })

  it('does not throw on empty schedule', () => {
    const empty: BbdRunResponse = {
      schedule: [],
      estate_sell_path: minimalResponse({}).estate_sell_path,
      estate_bbd_path: minimalResponse({}).estate_bbd_path,
      bbd_net_advantage_vs_sell_path: 0,
      monte_carlo: null,
    }
    const nodes = [
      {
        ref: 'chk',
        display_name: 'Checking',
        kind: 'checking' as const,
        institution: null,
        layout_x: null,
        layout_y: null,
      },
    ]
    expect(suggestedEdgesFromBbdResponse(empty, nodes).edges).toHaveLength(0)
  })
})
