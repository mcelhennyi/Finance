import { describe, expect, it } from 'vitest'

import {
  createDefaultScenario,
  hydrateScenarioFromApiShape,
  scenarioToApiPayload,
} from './bbdScenario'

describe('scenarioToApiPayload', () => {
  it('drops UI toggles when convert and savings overrides are disabled', () => {
    const s = createDefaultScenario()
    const p = scenarioToApiPayload(s) as Record<string, unknown>
    expect(p.strategy).not.toHaveProperty('convert_primary_enabled')
    expect(p.strategy).not.toHaveProperty('convert_primary_to_rental_year')
    expect(p.savings).not.toHaveProperty('annual_taxable_savings_override')
  })

  it('includes convertible year only when UI flag enabled', () => {
    const s = createDefaultScenario()
    s.strategy.convert_primary_enabled = true
    s.strategy.convert_primary_to_rental_year = 2031
    const p = scenarioToApiPayload(s) as Record<string, unknown>
    const strat = p.strategy as Record<string, unknown>
    expect(strat.convert_primary_to_rental_year).toBe(2031)
    expect(strat.convert_primary_enabled).toBeUndefined()
  })
})

describe('hydrateScenarioFromApiShape', () => {
  it('infer savings override checkbox from primitive JSON', () => {
    const h = hydrateScenarioFromApiShape({ savings: { annual_taxable_savings_override: 40000 } })
    expect(h.savings.annual_taxable_savings_override_enabled).toBe(true)
    expect(h.savings.annual_taxable_savings_override).toBe(40000)
  })
})
