/** BBD structured form — binds to `/api/bbd-projection/run` scenario shape. */

import type { Dispatch, SetStateAction } from 'react'
import type { BbdScenarioState } from '../../lib/bbdScenario'
import { createDefaultPrivateEquity, createDefaultProperty } from '../../lib/bbdScenario'

function NumField(props: {
  label: string
  value: number
  step?: string
  hint?: string
  onCommit: (n: number) => void
}) {
  const { label, value, step = '1', hint, onCommit } = props
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {hint ? (
        <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">{hint}</span>
      ) : null}
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={e =>
          onCommit(e.target.value === '' ? 0 : Number(e.target.value) || 0)
        }
        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      />
    </label>
  )
}

function CheckField(props: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const { label, checked, onChange } = props
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

function SectionTitle(props: { children: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-4">
      {props.children}
    </h2>
  )
}

export interface BbdScenarioFieldsProps {
  scenario: BbdScenarioState
  setScenario: Dispatch<SetStateAction<BbdScenarioState>>
}

export function BbdScenarioFields({ scenario, setScenario }: BbdScenarioFieldsProps) {
  const pn = (
    updater: (
      prev: BbdScenarioState['properties'][number],
    ) => BbdScenarioState['properties'][number],
    idx: number,
  ) =>
    setScenario(s => ({
      ...s,
      properties: s.properties.map((row, i) => (i === idx ? updater(row) : row)),
    }))

  const pe = (
    updater: (
      prev: BbdScenarioState['private_equity'][number],
    ) => BbdScenarioState['private_equity'][number],
    idx: number,
  ) =>
    setScenario(s => ({
      ...s,
      private_equity: s.private_equity.map((row, i) => (i === idx ? updater(row) : row)),
    }))

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Timing</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumField
            label="Start year"
            value={scenario.timing.start_year}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                timing: { ...s.timing, start_year: Math.max(1900, Math.round(v)) },
              }))
            }
          />
          <NumField
            label="Horizon (years)"
            value={scenario.timing.horizon_years}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                timing: {
                  ...s.timing,
                  horizon_years: Math.min(80, Math.max(1, Math.round(v))),
                },
              }))
            }
          />
          <NumField
            label="Starting age"
            value={scenario.timing.current_age}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                timing: { ...s.timing, current_age: Math.max(0, Math.round(v)) },
              }))
            }
          />
        </div>
      </div>

      <div>
        <SectionTitle>Income</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumField
            label="W-2 gross (annual)"
            value={scenario.income.w2_gross_income}
            step="1000"
            onCommit={v =>
              setScenario(s => ({
                ...s,
                income: { ...s.income, w2_gross_income: v },
              }))
            }
          />
          <NumField
            label="W-2 growth rate"
            step="0.001"
            hint="decimal per year"
            value={scenario.income.w2_growth_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                income: { ...s.income, w2_growth_rate: v },
              }))
            }
          />
          <NumField
            label="Years until W-2 ends"
            value={scenario.income.w2_retire_year_offset}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                income: {
                  ...s.income,
                  w2_retire_year_offset: Math.max(0, Math.round(v)),
                },
              }))
            }
          />
        </div>
      </div>

      <div>
        <SectionTitle>Expenses</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField
            label="Annual living expenses"
            value={scenario.expenses.annual_living_expenses}
            step="500"
            onCommit={v =>
              setScenario(s => ({
                ...s,
                expenses: { ...s.expenses, annual_living_expenses: v },
              }))
            }
          />
          <NumField
            label="Expense inflation"
            step="0.001"
            hint="decimal"
            value={scenario.expenses.expense_inflation}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                expenses: { ...s.expenses, expense_inflation: v },
              }))
            }
          />
        </div>
      </div>

      <div>
        <SectionTitle>Savings & portfolio inputs</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <NumField
            label="401(k) contrib"
            step="500"
            value={scenario.savings.annual_401k_contribution}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, annual_401k_contribution: v },
              }))
            }
          />
          <NumField
            label="Employer match"
            step="100"
            value={scenario.savings.employer_match}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, employer_match: v },
              }))
            }
          />
          <NumField
            label="Starting taxable portfolio"
            step="1000"
            value={scenario.savings.starting_taxable_portfolio}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, starting_taxable_portfolio: v },
              }))
            }
          />
          <NumField
            label="Starting portfolio basis"
            step="1000"
            value={scenario.savings.starting_portfolio_basis}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, starting_portfolio_basis: v },
              }))
            }
          />
          <NumField
            label="Portfolio nominal return"
            step="0.001"
            hint="decimal"
            value={scenario.savings.portfolio_nominal_return}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, portfolio_nominal_return: v },
              }))
            }
          />
          <NumField
            label="Portfolio volatility"
            step="0.01"
            value={scenario.savings.portfolio_volatility}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, portfolio_volatility: v },
              }))
            }
          />
          <NumField
            label="Dividend yield"
            step="0.001"
            hint="decimal"
            value={scenario.savings.portfolio_dividend_yield}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, portfolio_dividend_yield: v },
              }))
            }
          />
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <CheckField
            label="Fixed annual taxable savings override"
            checked={scenario.savings.annual_taxable_savings_override_enabled}
            onChange={chk =>
              setScenario(s => ({
                ...s,
                savings: {
                  ...s.savings,
                  annual_taxable_savings_override_enabled: chk,
                  annual_taxable_savings_override: chk
                    ? (s.savings.annual_taxable_savings_override ?? 30_000)
                    : null,
                },
              }))
            }
          />
          {scenario.savings.annual_taxable_savings_override_enabled ? (
            <div className="w-52">
              <NumField
                label="Annual override amount"
                step="500"
                value={scenario.savings.annual_taxable_savings_override ?? 0}
                onCommit={v =>
                  setScenario(s => ({
                    ...s,
                    savings: {
                      ...s.savings,
                      annual_taxable_savings_override: v,
                    },
                  }))
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      <details className="rounded-lg border border-slate-100 bg-slate-50/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Tax rates</summary>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <NumField
            label="Federal marginal"
            step="0.01"
            value={scenario.taxes.federal_marginal_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, federal_marginal_rate: v },
              }))
            }
          />
          <NumField
            label="State marginal"
            step="0.005"
            value={scenario.taxes.state_marginal_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, state_marginal_rate: v },
              }))
            }
          />
          <NumField
            label="LTCG rate"
            step="0.01"
            value={scenario.taxes.ltcg_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, ltcg_rate: v },
              }))
            }
          />
          <NumField
            label="NIIT rate"
            step="0.001"
            value={scenario.taxes.niit_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, niit_rate: v },
              }))
            }
          />
          <NumField
            label="Depreciation recapture"
            step="0.01"
            hint="decimal"
            value={scenario.taxes.depreciation_recapture_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, depreciation_recapture_rate: v },
              }))
            }
          />
        </div>
      </details>

      <details className="rounded-lg border border-slate-100 bg-slate-50/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Borrowing & rates (SBLOC, HELOC, refi caps)
        </summary>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <NumField
            label="SBLOC max LTV"
            step="0.05"
            value={scenario.borrowing.sbloc_ltv_cap}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sbloc_ltv_cap: v },
              }))
            }
          />
          <NumField
            label="SBLOC margin-call LTV"
            step="0.05"
            value={scenario.borrowing.sbloc_margin_call_ltv}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sbloc_margin_call_ltv: v },
              }))
            }
          />
          <NumField
            label="SBLOC spread above SOFR"
            step="0.001"
            value={scenario.borrowing.sbloc_spread_over_sofr}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: {
                  ...s.borrowing,
                  sbloc_spread_over_sofr: v,
                },
              }))
            }
          />
          <NumField
            label="Starting SOFR"
            step="0.001"
            value={scenario.borrowing.sofr_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sofr_rate: v },
              }))
            }
          />
          <NumField
            label="SOFR long-run mean"
            step="0.001"
            value={scenario.borrowing.sofr_long_run}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: {
                  ...s.borrowing,
                  sofr_long_run: v,
                },
              }))
            }
          />
          <NumField
            label="Rate mean-reversion"
            step="0.05"
            value={scenario.borrowing.rate_mean_reversion}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: {
                  ...s.borrowing,
                  rate_mean_reversion: v,
                },
              }))
            }
          />
          <NumField
            label="HELOC spread vs prime"
            step="0.001"
            value={scenario.borrowing.heloc_rate_spread_over_prime}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: {
                  ...s.borrowing,
                  heloc_rate_spread_over_prime: v,
                },
              }))
            }
          />
          <NumField
            label="Cash-out refi rate"
            step="0.005"
            value={scenario.borrowing.cashout_refi_rate}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, cashout_refi_rate: v },
              }))
            }
          />
          <NumField
            label="HELOC max CLTV"
            step="0.05"
            value={scenario.borrowing.heloc_max_cltv}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, heloc_max_cltv: v },
              }))
            }
          />
          <NumField
            label="Cash-out max CLTV"
            step="0.05"
            value={scenario.borrowing.cashout_refi_max_cltv}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: {
                  ...s.borrowing,
                  cashout_refi_max_cltv: v,
                },
              }))
            }
          />
        </div>
      </details>

      <div>
        <SectionTitle>Drawdown strategy</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4 mb-3">
          <NumField
            label="Years until borrow phase"
            value={scenario.strategy.drawdown_start_year_offset}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                strategy: {
                  ...s.strategy,
                  drawdown_start_year_offset: Math.max(0, Math.round(v)),
                },
              }))
            }
          />
          <NumField
            label="Target annual tax-free draw"
            step="1000"
            value={scenario.strategy.target_annual_drawdown}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                strategy: {
                  ...s.strategy,
                  target_annual_drawdown: v,
                },
              }))
            }
          />
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              PE exit treatment
            </span>
            <select
              value={scenario.strategy.pe_exit_treatment}
              className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              onChange={e =>
                setScenario(s => ({
                  ...s,
                  strategy: {
                    ...s.strategy,
                    pe_exit_treatment: e.target.value as typeof s.strategy.pe_exit_treatment,
                  },
                }))
              }
            >
              <option value="cash">cash</option>
              <option value="stock">stock</option>
              <option value="hold">hold</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-6 mb-4">
          <CheckField
            label="Capitalize interest on borrowing"
            checked={scenario.strategy.capitalize_interest}
            onChange={v =>
              setScenario(s => ({
                ...s,
                strategy: {
                  ...s.strategy,
                  capitalize_interest: v,
                },
              }))
            }
          />
          <CheckField
            label="Inflate draw target with CPI-style expense assumption"
            checked={scenario.strategy.inflate_drawdown}
            onChange={v =>
              setScenario(s => ({
                ...s,
                strategy: { ...s.strategy, inflate_drawdown: v },
              }))
            }
          />
          <CheckField
            label="Convert primary to rental"
            checked={scenario.strategy.convert_primary_enabled}
            onChange={chk =>
              setScenario(s => ({
                ...s,
                strategy: {
                  ...s.strategy,
                  convert_primary_enabled: chk,
                  convert_primary_to_rental_year: chk
                    ? (s.strategy.convert_primary_to_rental_year ??
                      s.timing.start_year + 5)
                    : null,
                },
              }))
            }
          />
        </div>
        {scenario.strategy.convert_primary_enabled ? (
          <NumField
            label="Conversion calendar year"
            value={scenario.strategy.convert_primary_to_rental_year ?? scenario.timing.start_year}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                strategy: {
                  ...s.strategy,
                  convert_primary_to_rental_year: Math.round(v),
                },
              }))
            }
          />
        ) : null}
      </div>

      <div>
        <SectionTitle>Properties</SectionTitle>
        <button
          type="button"
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 mb-4"
          onClick={() =>
            setScenario(s => ({
              ...s,
              properties: [...s.properties, createDefaultProperty()],
            }))
          }
        >
          + Add property
        </button>
        <div className="space-y-5">
          {scenario.properties.map((row, idx) => (
            <div
              key={`p-${idx}-${row.name}`}
              className="rounded-xl border border-slate-100 p-4 bg-slate-50/40 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Property {idx + 1}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                  onClick={() =>
                    setScenario(s => ({
                      ...s,
                      properties: s.properties.filter((_, j) => j !== idx),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
              <label className="block text-sm">
                <span className="text-[11px] uppercase text-slate-400 font-semibold">Name</span>
                <input
                  type="text"
                  value={row.name}
                  onChange={e => pn(prev => ({ ...prev, name: e.target.value }), idx)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <CheckField
                label="Primary residence"
                checked={row.is_primary}
                onChange={v =>
                  pn(pr => ({ ...pr, is_primary: v }), idx)
                }
              />
              <div className="grid md:grid-cols-4 gap-3">
                <NumField
                  label="Purchase price"
                  step="1000"
                  value={row.purchase_price}
                  onCommit={v => pn(pr => ({ ...pr, purchase_price: v }), idx)}
                />
                <NumField
                  label="Purchase year"
                  value={row.purchase_year}
                  onCommit={v => pn(pr => ({ ...pr, purchase_year: Math.round(v) }), idx)}
                />
                <NumField
                  label="Current value"
                  step="1000"
                  value={row.current_value}
                  onCommit={v => pn(pr => ({ ...pr, current_value: v }), idx)}
                />
                <NumField
                  label="Mortgage balance"
                  step="1000"
                  value={row.mortgage_balance}
                  onCommit={v => pn(pr => ({ ...pr, mortgage_balance: v }), idx)}
                />
                <NumField
                  label="Mortgage APR"
                  step="0.001"
                  hint="decimal"
                  value={row.mortgage_rate}
                  onCommit={v => pn(pr => ({ ...pr, mortgage_rate: v }), idx)}
                />
                <NumField
                  label="Mortgage term (years)"
                  value={row.mortgage_term_years}
                  onCommit={v =>
                    pn(pr => ({ ...pr, mortgage_term_years: Math.max(1, Math.round(v)) }), idx)}
                />
                <NumField
                  label="Mortgage start year"
                  value={row.mortgage_origination_year}
                  onCommit={v =>
                    pn(pr => ({
                      ...pr,
                      mortgage_origination_year: Math.round(v),
                    }), idx)}
                />
                <NumField
                  label="Monthly PITI"
                  step="50"
                  value={row.monthly_piti}
                  onCommit={v => pn(pr => ({ ...pr, monthly_piti: v }), idx)}
                />
                <NumField
                  label="Monthly market rent"
                  step="50"
                  value={row.monthly_market_rent}
                  onCommit={v => pn(pr => ({ ...pr, monthly_market_rent: v }), idx)}
                />
              </div>
              <details className="rounded border border-dashed border-slate-200 p-3 mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                  Property economics details
                </summary>
                <div className="mt-3 grid md:grid-cols-4 gap-3">
                  <NumField
                    label="Rental start year (0 = unset)"
                    value={row.rental_start_year ?? 0}
                    onCommit={v => {
                      const y = Math.round(v)
                      pn(pr => ({
                        ...pr,
                        rental_start_year: y <= 0 ? null : y,
                      }), idx)
                    }}
                  />
                  <NumField
                    label="Appreciation rate"
                    step="0.001"
                    hint="decimal"
                    value={row.appreciation_rate}
                    onCommit={v => pn(pr => ({ ...pr, appreciation_rate: v }), idx)}
                  />
                  <NumField
                    label="Rent growth"
                    step="0.001"
                    value={row.rent_growth_rate}
                    onCommit={v => pn(pr => ({ ...pr, rent_growth_rate: v }), idx)}
                  />
                  <NumField
                    label="Vacancy + mgmt"
                    step="0.01"
                    value={row.vacancy_and_mgmt_pct}
                    onCommit={v => pn(pr => ({ ...pr, vacancy_and_mgmt_pct: v }), idx)}
                  />
                  <NumField
                    label="Maintenance % value"
                    step="0.001"
                    value={row.annual_maintenance_pct}
                    onCommit={v => pn(pr => ({ ...pr, annual_maintenance_pct: v }), idx)}
                  />
                  <NumField
                    label="Land allocation"
                    step="0.05"
                    hint="% of basis"
                    value={row.land_value_pct}
                    onCommit={v => pn(pr => ({ ...pr, land_value_pct: v }), idx)}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Use <span className="font-mono">0</span> when the unit is not on the rental timeline yet.
                  Strategy “convert primary to rental” can still drive timing.
                </p>
              </details>
            </div>
          ))}
          {scenario.properties.length === 0 ? (
            <p className="text-sm text-slate-500">No properties (optional).</p>
          ) : null}
        </div>
      </div>

      <div>
        <SectionTitle>Private equity</SectionTitle>
        <button
          type="button"
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 mb-4"
          onClick={() =>
            setScenario(s => ({
              ...s,
              private_equity: [...s.private_equity, createDefaultPrivateEquity()],
            }))
          }
        >
          + Add illiquid PE position
        </button>
        <div className="space-y-5">
          {scenario.private_equity.map((row, idx) => (
            <div
              key={`pe-${idx}-${row.name}`}
              className="rounded-xl border border-slate-100 p-4 bg-slate-50/40 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Position {idx + 1}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                  onClick={() =>
                    setScenario(s => ({
                      ...s,
                      private_equity: s.private_equity.filter((_, j) => j !== idx),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
              <label className="block text-sm">
                <span className="text-[11px] uppercase text-slate-400 font-semibold">Name</span>
                <input
                  type="text"
                  value={row.name}
                  onChange={e => pe(prev => ({ ...prev, name: e.target.value }), idx)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <div className="grid md:grid-cols-4 gap-3">
                <NumField
                  label="Current value mark"
                  step="5000"
                  value={row.current_value}
                  onCommit={v => pe(pr => ({ ...pr, current_value: v }), idx)}
                />
                <NumField
                  label="Cost basis"
                  step="1000"
                  value={row.cost_basis}
                  onCommit={v => pe(pr => ({ ...pr, cost_basis: v }), idx)}
                />
                <NumField
                  label="Expected growth rate"
                  step="0.01"
                  hint="decimal"
                  value={row.expected_growth_rate}
                  onCommit={v => pe(pr => ({ ...pr, expected_growth_rate: v }), idx)}
                />
                <NumField
                  label="Volatility"
                  step="0.05"
                  value={row.volatility}
                  onCommit={v => pe(pr => ({ ...pr, volatility: v }), idx)}
                />
                <NumField
                  label="Annual failure prob."
                  step="0.02"
                  value={row.annual_failure_prob}
                  onCommit={v => pe(pr => ({ ...pr, annual_failure_prob: v }), idx)}
                />
                <NumField
                  label="Annual exit prob."
                  step="0.02"
                  value={row.annual_exit_prob}
                  onCommit={v => pe(pr => ({ ...pr, annual_exit_prob: v }), idx)}
                />
                <NumField
                  label="Exit multiple mean"
                  step="0.1"
                  value={row.exit_multiple_mean}
                  onCommit={v => pe(pr => ({ ...pr, exit_multiple_mean: v }), idx)}
                />
                <NumField
                  label="Exit multiple σ"
                  step="0.1"
                  value={row.exit_multiple_vol}
                  onCommit={v => pe(pr => ({ ...pr, exit_multiple_vol: v }), idx)}
                />
              </div>
            </div>
          ))}
          {scenario.private_equity.length === 0 ? (
            <p className="text-sm text-slate-500">No private-equity holdings (optional).</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
