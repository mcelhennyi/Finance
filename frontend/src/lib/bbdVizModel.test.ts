import { describe, expect, it } from 'vitest'

import { buildBbdVizModel, sampleScheduleForTable } from './bbdVizModel'
import type { BbdRunResponse, BbdScheduleRow } from '../types'

function row(y: number, draw: number): BbdScheduleRow {
  return {
    year: y,
    age: 40 + (y - 2025),
    w2_income: 0,
    rental_net_cash_flow: 0,
    portfolio_dividends: 0,
    drawdown_borrowed: draw,
    taxes_paid: 0,
    living_expenses: 0,
    gross_cash_income: draw,
    taxes_delta_yoy: null,
    gross_income_delta_yoy: null,
    portfolio_value: 1e6,
    portfolio_basis: 0,
    portfolio_unrealized_gain: 0,
    properties_value: 0,
    properties_mortgage_balance: 0,
    pe_value: 0,
    pe_basis: 0,
    pe_exited_this_year: false,
    sbloc_balance: draw * 0.5,
    heloc_refi_balance: 0,
    total_assets: 1e6,
    total_liabilities: draw * 0.5,
    net_worth: 1e6 - draw * 0.5,
    sbloc_capacity_remaining: 0,
    sbloc_ltv: 0.1,
    margin_call: false,
    sofr: 0.05,
    sbloc_rate: 0.06,
  }
}

const baseEstate = {
  gross_estate: 1e7,
  debt_to_repay: 1e6,
  cap_gains_tax: 0,
  depreciation_recapture_tax: 0,
  net_to_heirs: 8e6,
}

const minimalResponse = (schedule: BbdScheduleRow[]): BbdRunResponse => ({
  schedule,
  estate_sell_path: { label: 'Sell', ...baseEstate, net_to_heirs: 7e6 },
  estate_bbd_path: { label: 'BBD', ...baseEstate },
  bbd_net_advantage_vs_sell_path: 1e6,
  monte_carlo: null,
})

describe('buildBbdVizModel', () => {
  it('returns null bounds and empty schedule for empty response', () => {
    const m = buildBbdVizModel(minimalResponse([]))
    expect(m.schedule).toEqual([])
    expect(m.bounds).toBeNull()
    expect(m.borrowHeavyYears).toEqual([])
    expect(m.estateBars).toHaveLength(2)
  })

  it('computes bounds and borrow-heavy years from draws', () => {
    const schedule = [
      row(2025, 10_000),
      row(2026, 50_000),
      row(2027, 100_000),
      row(2028, 100_000),
    ]
    const m = buildBbdVizModel(minimalResponse(schedule))
    expect(m.bounds?.yearMin).toBe(2025)
    expect(m.bounds?.yearMax).toBe(2028)
    expect(m.borrowHeavyYears.length).toBeGreaterThan(0)
    expect(m.borrowHeavyYears).toContain(2027)
  })
})

describe('sampleScheduleForTable', () => {
  it('returns every step rows plus last', () => {
    const r = Array.from({ length: 11 }, (_, i) => row(2020 + i, 0))
    const s = sampleScheduleForTable(r, 5)
    expect(s.map(x => x.year)).toEqual([2020, 2025, 2030])
  })
})
