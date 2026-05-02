/**
 * Scenario state for BBD projection UI — shape matches `/api/bbd-projection/run` `scenario`.
 */

export type PeExitTreatment = 'cash' | 'stock' | 'hold'

export interface BbdTiming {
  start_year: number
  horizon_years: number
  current_age: number
}

export interface BbdIncome {
  w2_gross_income: number
  w2_growth_rate: number
  w2_retire_year_offset: number
}

export interface BbdTaxes {
  federal_marginal_rate: number
  state_marginal_rate: number
  ltcg_rate: number
  niit_rate: number
  depreciation_recapture_rate: number
}

export interface BbdExpenses {
  annual_living_expenses: number
  expense_inflation: number
}

export interface BbdSavings {
  annual_401k_contribution: number
  employer_match: number
  starting_taxable_portfolio: number
  starting_portfolio_basis: number
  portfolio_nominal_return: number
  portfolio_volatility: number
  portfolio_dividend_yield: number
  annual_taxable_savings_override_enabled: boolean
  annual_taxable_savings_override: number | null
}

export interface BbdBorrowing {
  sbloc_ltv_cap: number
  sbloc_margin_call_ltv: number
  sbloc_spread_over_sofr: number
  sofr_rate: number
  sofr_long_run: number
  rate_mean_reversion: number
  heloc_rate_spread_over_prime: number
  cashout_refi_rate: number
  heloc_max_cltv: number
  cashout_refi_max_cltv: number
}

export interface BbdStrategy {
  drawdown_start_year_offset: number
  target_annual_drawdown: number
  capitalize_interest: boolean
  inflate_drawdown: boolean
  convert_primary_enabled: boolean
  convert_primary_to_rental_year: number | null
  pe_exit_treatment: PeExitTreatment
}

export interface BbdPropertyRow {
  name: string
  purchase_price: number
  purchase_year: number
  current_value: number
  mortgage_balance: number
  mortgage_rate: number
  mortgage_term_years: number
  mortgage_origination_year: number
  monthly_piti: number
  monthly_market_rent: number
  is_primary: boolean
  rental_start_year: number | null
  appreciation_rate: number
  rent_growth_rate: number
  vacancy_and_mgmt_pct: number
  annual_maintenance_pct: number
  land_value_pct: number
}

export interface BbdPrivateEquityRow {
  name: string
  current_value: number
  cost_basis: number
  expected_growth_rate: number
  volatility: number
  annual_failure_prob: number
  annual_exit_prob: number
  exit_multiple_mean: number
  exit_multiple_vol: number
}

export interface BbdScenarioState {
  timing: BbdTiming
  income: BbdIncome
  taxes: BbdTaxes
  expenses: BbdExpenses
  savings: BbdSavings
  borrowing: BbdBorrowing
  strategy: BbdStrategy
  properties: BbdPropertyRow[]
  private_equity: BbdPrivateEquityRow[]
}

export interface BbdPreset {
  id: string
  name: string
  updatedAt: string
  scenario: BbdScenarioState
}

const STORAGE_VERSION = 'v1'
export const BBD_PRESETS_STORAGE_KEY = `finance-hub.bbd-presets.${STORAGE_VERSION}`

/** Max presets to avoid exhausting localStorage. */
export const MAX_BBD_PRESETS = 36

/** Deep mutable clone — used when loading defaults / presets. */
export function cloneScenario(s: BbdScenarioState): BbdScenarioState {
  return structuredClone(s)
}

export function createDefaultScenario(): BbdScenarioState {
  return {
    timing: { start_year: 2026, horizon_years: 20, current_age: 35 },
    income: {
      w2_gross_income: 190_000,
      w2_growth_rate: 0.03,
      w2_retire_year_offset: 30,
    },
    taxes: {
      federal_marginal_rate: 0.24,
      state_marginal_rate: 0.05,
      ltcg_rate: 0.15,
      niit_rate: 0.038,
      depreciation_recapture_rate: 0.25,
    },
    expenses: {
      annual_living_expenses: 90_000,
      expense_inflation: 0.03,
    },
    savings: {
      annual_401k_contribution: 23_000,
      employer_match: 9_500,
      starting_taxable_portfolio: 120_000,
      starting_portfolio_basis: 100_000,
      portfolio_nominal_return: 0.085,
      portfolio_volatility: 0.16,
      portfolio_dividend_yield: 0.015,
      annual_taxable_savings_override_enabled: false,
      annual_taxable_savings_override: null,
    },
    borrowing: {
      sbloc_ltv_cap: 0.5,
      sbloc_margin_call_ltv: 0.7,
      sbloc_spread_over_sofr: 0.025,
      sofr_rate: 0.0365,
      sofr_long_run: 0.03,
      rate_mean_reversion: 0.2,
      heloc_rate_spread_over_prime: 0.005,
      cashout_refi_rate: 0.072,
      heloc_max_cltv: 0.85,
      cashout_refi_max_cltv: 0.75,
    },
    strategy: {
      drawdown_start_year_offset: 18,
      target_annual_drawdown: 80_000,
      capitalize_interest: true,
      inflate_drawdown: true,
      convert_primary_enabled: false,
      convert_primary_to_rental_year: null,
      pe_exit_treatment: 'cash',
    },
    properties: [createDefaultProperty()],
    private_equity: [createDefaultPrivateEquity()],
  }
}

export function createDefaultProperty(): BbdPropertyRow {
  return {
    name: 'Primary Home',
    purchase_price: 360_000,
    purchase_year: 2021,
    current_value: 420_000,
    mortgage_balance: 308_000,
    mortgage_rate: 0.03,
    mortgage_term_years: 30,
    mortgage_origination_year: 2021,
    monthly_piti: 2_500,
    monthly_market_rent: 2_400,
    is_primary: true,
    rental_start_year: null,
    appreciation_rate: 0.035,
    rent_growth_rate: 0.03,
    vacancy_and_mgmt_pct: 0.1,
    annual_maintenance_pct: 0.01,
    land_value_pct: 0.2,
  }
}

export function createDefaultPrivateEquity(): BbdPrivateEquityRow {
  return {
    name: 'Startup equity',
    current_value: 50_000,
    cost_basis: 0,
    expected_growth_rate: 0.15,
    volatility: 0.55,
    annual_failure_prob: 0.06,
    annual_exit_prob: 0.08,
    exit_multiple_mean: 2.5,
    exit_multiple_vol: 1.5,
  }
}

/** Strip UI-only flags and coerce nulls before POST (undefined keys omitted). */
export function scenarioToApiPayload(form: BbdScenarioState): Record<string, unknown> {
  const {
    convert_primary_enabled,
    convert_primary_to_rental_year,
    ...strategyRest
  } = form.strategy
  const {
    annual_taxable_savings_override_enabled,
    annual_taxable_savings_override,
    ...savingsRest
  } = form.savings

  const scenario = {
    timing: form.timing,
    income: form.income,
    taxes: form.taxes,
    expenses: form.expenses,
    savings: {
      ...savingsRest,
      ...(annual_taxable_savings_override_enabled && annual_taxable_savings_override != null
        ? { annual_taxable_savings_override }
        : {}),
    },
    borrowing: form.borrowing,
    strategy: {
      ...strategyRest,
      ...(convert_primary_enabled && convert_primary_to_rental_year != null
        ? { convert_primary_to_rental_year }
        : {}),
    },
    properties: form.properties.map(p => ({
      ...p,
      rental_start_year:
        typeof p.rental_start_year === 'number' && !Number.isNaN(p.rental_start_year)
          ? p.rental_start_year
          : undefined,
    })),
    private_equity: form.private_equity,
  }

  return JSON.parse(JSON.stringify(scenario))
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function mergeFlat<T extends object>(defaults: T, patch: unknown): T {
  if (!isPlainObject(patch)) return { ...structuredClone(defaults) }
  return { ...structuredClone(defaults), ...patch } as T
}

/**
 * Builds form state from a partial API-shaped JSON object (clipboard / legacy presets).
 */
export function hydrateScenarioFromApiShape(raw: unknown): BbdScenarioState {
  const base = createDefaultScenario()
  if (!isPlainObject(raw)) return base

  const savings = mergeFlat(base.savings, raw.savings)
  const ov = (raw.savings as Record<string, unknown> | undefined)?.annual_taxable_savings_override
  if (typeof ov === 'number' && !Number.isNaN(ov)) {
    savings.annual_taxable_savings_override_enabled = true
    savings.annual_taxable_savings_override = ov
  }

  const strategy = mergeFlat(base.strategy, raw.strategy)
  const conv = (raw.strategy as Record<string, unknown> | undefined)?.convert_primary_to_rental_year
  if (typeof conv === 'number' && !Number.isNaN(conv)) {
    strategy.convert_primary_enabled = true
    strategy.convert_primary_to_rental_year = conv
  }

  if (!(['cash', 'stock', 'hold'] as readonly PeExitTreatment[]).includes(strategy.pe_exit_treatment)) {
    strategy.pe_exit_treatment = base.strategy.pe_exit_treatment
  }

  let properties = base.properties
  if (Array.isArray(raw.properties) && raw.properties.length > 0) {
    properties = raw.properties.map(row => mergeFlat(createDefaultProperty(), row))
  }

  let privateEquity = base.private_equity
  if (Array.isArray(raw.private_equity) && raw.private_equity.length > 0) {
    privateEquity = raw.private_equity.map(row => mergeFlat(createDefaultPrivateEquity(), row))
  }

  return {
    timing: mergeFlat(base.timing, raw.timing),
    income: mergeFlat(base.income, raw.income),
    taxes: mergeFlat(base.taxes, raw.taxes),
    expenses: mergeFlat(base.expenses, raw.expenses),
    savings,
    borrowing: mergeFlat(base.borrowing, raw.borrowing),
    strategy,
    properties,
    private_equity: privateEquity,
  }
}

/** Load presets; ignore corrupt JSON. */
export function loadPresets(): BbdPreset[] {
  try {
    const raw = window.localStorage.getItem(BBD_PRESETS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is BbdPreset =>
        typeof p === 'object' &&
        p !== null &&
        'id' in p &&
        'name' in p &&
        'scenario' in p,
    )
  } catch {
    return []
  }
}

export function savePresets(presets: BbdPreset[]): void {
  const trimmed = presets.slice(-MAX_BBD_PRESETS)
  window.localStorage.setItem(BBD_PRESETS_STORAGE_KEY, JSON.stringify(trimmed))
}

export function upsertPreset(presets: BbdPreset[], name: string, scenario: BbdScenarioState): BbdPreset[] {
  const trimmed = name.trim()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const next: BbdPreset = {
    id,
    name: trimmed.slice(0, 120),
    updatedAt: now,
    scenario: cloneScenario(scenario),
  }
  const existing = presets.filter(p => p.name.toLowerCase() !== trimmed.toLowerCase())
  return [...existing, next].slice(-MAX_BBD_PRESETS)
}

export function deletePresetById(presets: BbdPreset[], id: string): BbdPreset[] {
  return presets.filter(p => p.id !== id)
}
