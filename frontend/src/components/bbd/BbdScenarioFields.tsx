/** BBD structured form — binds to `/api/bbd-projection/run` scenario shape. */

import type { Dispatch, SetStateAction } from 'react'
import { OutputHoverTip } from '../OutputHoverTip'
import type { BbdScenarioState } from '../../lib/bbdScenario'
import { createDefaultPrivateEquity, createDefaultProperty } from '../../lib/bbdScenario'
import { FormFieldLabel, MoneyField, PctField, UnitCaption } from './BbdValueFields'
import { BbdDocsSectionLink } from './BbdDocsContext'
import { BBD_FIELD_TIPS } from './bbdFieldTips'
import type { BbdDocsSection } from './bbdDocAnchors'

function NumField(props: {
  label: string
  value: number
  step?: string
  hint?: string
  narrow?: boolean
  /** Explains integers (years vs counts vs speed). */
  unit?: string
  tip?: string
  onCommit: (n: number) => void
}) {
  const { label, value, step = '1', hint, narrow, unit, tip, onCommit } = props
  return (
    <label className="block">
      <FormFieldLabel label={label} tip={tip} />
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
        className={`mt-0.5 ${narrow ? 'w-full max-w-[6.75rem]' : 'w-full'} rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`}
      />
      {unit ? <UnitCaption text={unit} /> : null}
    </label>
  )
}

function CheckField(props: {
  label: string
  checked: boolean
  tip?: string
  onChange: (v: boolean) => void
}) {
  const { label, checked, tip, onChange } = props
  const textCls = 'text-sm text-slate-700'
  const labelInner = tip ? (
    <OutputHoverTip tip={tip} dashed={false} placement="below" className={textCls}>
      {label}
    </OutputHoverTip>
  ) : (
    <span className={textCls}>{label}</span>
  )

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      {labelInner}
    </label>
  )
}

function SectionTitle(props: { children: string; docsSection?: BbdDocsSection }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-slate-100 pb-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{props.children}</h2>
      {props.docsSection ? <BbdDocsSectionLink section={props.docsSection} /> : null}
    </div>
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
      <p className="text-[11px] leading-relaxed text-slate-600 border border-slate-100 rounded-lg px-3 py-2.5 bg-slate-50/85">
        <span className="font-semibold text-slate-700">Units cheat sheet.</span>{' '}
        <strong className="font-medium text-slate-600">$</strong>{' '}rows specify nominal-USD cadence in the muted
        line underneath. <strong className="font-medium text-slate-600">%</strong> rows clarify what each percent
        attaches to directly under the control (collateral balances, modeled income, modeled years). Whole-number
        year inputs are Gregorian calendar integers unless labeled as counted years from horizon start.
        <br />
        <span className="mt-1 inline-block text-[10px] leading-snug text-slate-500">
          Hover a field label—each shows how that input feeds the modeled taxes, borrowing, portfolio, or estate heuristic.
        </span>{' '}
        <span className="mt-1 block">
          <BbdDocsSectionLink
            section="intro"
            label="Planner overview ›"
            className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
          />
        </span>
      </p>

      <div>
        <SectionTitle docsSection="timing">Timing</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumField
            label="Start year"
            tip={BBD_FIELD_TIPS.timing.startYear}
            narrow
            unit="Calendar · first modeled year."
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
            tip={BBD_FIELD_TIPS.timing.horizonYears}
            narrow
            unit="Count of simulated years (annual steps)."
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
            tip={BBD_FIELD_TIPS.timing.startingAge}
            narrow
            unit="Completed years · at start year."
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
        <SectionTitle docsSection="income">Income</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoneyField
            label="W-2 gross (annual)"
            tip={BBD_FIELD_TIPS.income.w2GrossAnnual}
            unit="Nominal USD per calendar year."
            value={scenario.income.w2_gross_income}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                income: { ...s.income, w2_gross_income: v },
              }))
            }
          />
          <PctField
            label="Annual raise (%/yr)"
            tip={BBD_FIELD_TIPS.income.w2GrowthRate}
            unit="Applied once per year to modeled wages."
            value={scenario.income.w2_growth_rate}
            step="0.1"
            displayDecimals={3}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                income: { ...s.income, w2_growth_rate: v },
              }))
            }
          />
          <NumField
            label="Years until W-2 ends"
            tip={BBD_FIELD_TIPS.income.w2YearsUntilEnds}
            narrow
            unit="Years after projection begins (not calendar end date)."
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
        <SectionTitle docsSection="expenses">Expenses</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MoneyField
            label="Annual living expenses"
            tip={BBD_FIELD_TIPS.expenses.annualLivingExpenses}
            unit="Nominal USD / year · excludes property P+I+tax here."
            value={scenario.expenses.annual_living_expenses}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                expenses: { ...s.expenses, annual_living_expenses: v },
              }))
            }
          />
          <PctField
            label="Expense inflation (%/yr)"
            tip={BBD_FIELD_TIPS.expenses.expenseInflation}
            unit="Growth on modeled non-housing consumption."
            value={scenario.expenses.expense_inflation}
            step="0.1"
            displayDecimals={3}
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
        <SectionTitle docsSection="savings">Savings & portfolio inputs</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <MoneyField
            label="401(k) elective deferrals"
            tip={BBD_FIELD_TIPS.savings401kDeferrals}
            unit="Nominal USD per calendar year."
            value={scenario.savings.annual_401k_contribution}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, annual_401k_contribution: v },
              }))
            }
          />
          <MoneyField
            label="Employer match"
            tip={BBD_FIELD_TIPS.savingsEmployerMatch}
            unit="Nominal USD credited per calendar year."
            value={scenario.savings.employer_match}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, employer_match: v },
              }))
            }
          />
          <MoneyField
            label="Starting taxable portfolio"
            tip={BBD_FIELD_TIPS.savingsStartingTaxablePortfolio}
            unit="Market value nominal USD · at projection start."
            value={scenario.savings.starting_taxable_portfolio}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, starting_taxable_portfolio: v },
              }))
            }
          />
          <MoneyField
            label="Starting portfolio basis"
            tip={BBD_FIELD_TIPS.savingsStartingBasis}
            unit="Cost basis nominal USD · at projection start."
            value={scenario.savings.starting_portfolio_basis}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, starting_portfolio_basis: v },
              }))
            }
          />
          <PctField
            label="Portfolio nominal return (%/yr)"
            tip={BBD_FIELD_TIPS.savingsPortfolioNominalReturn}
            unit="Nominal expected return modeled per year."
            value={scenario.savings.portfolio_nominal_return}
            step="0.1"
            displayDecimals={4}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, portfolio_nominal_return: v },
              }))
            }
          />
          <PctField
            label="Portfolio volatility (σ)"
            tip={BBD_FIELD_TIPS.savingsPortfolioVolatility}
            unit="Annualized variability of modeled returns."
            value={scenario.savings.portfolio_volatility}
            step="0.5"
            displayDecimals={3}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                savings: { ...s.savings, portfolio_volatility: v },
              }))
            }
          />
          <PctField
            label="Dividend yield (tax)"
            tip={BBD_FIELD_TIPS.savingsDividendYield}
            unit="% of portfolio value taxed as dividends each modeled year."
            value={scenario.savings.portfolio_dividend_yield}
            step="0.05"
            displayDecimals={4}
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
            tip={BBD_FIELD_TIPS.savingsOverrideToggle}
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
              <MoneyField
                label="Annual override amount"
                tip={BBD_FIELD_TIPS.savingsOverrideAmount}
                unit="Fixed nominal USD/year into taxable brokerage when checked."
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
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Tax rates</span>
          <BbdDocsSectionLink section="taxes" />
        </summary>
        <p className="mt-3 mb-4 text-[11px] leading-relaxed text-slate-500">
          Each percentage is nominal and applies inside the coarse tax simplification baked into this
          model (not individualized tax-law precision). Entries match the decimals in the HTTP API JSON,
          but fields show percents typed as readable numbers (
          <span className="font-mono">24</span>
          {' '}
          means 24%).
        </p>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <PctField
            label="Federal marginal bracket"
            tip={BBD_FIELD_TIPS.taxesFederalMarginal}
            unit="Rough % surcharge on modeled ordinary taxable income beyond standard assumptions."
            value={scenario.taxes.federal_marginal_rate}
            step="1"
            displayDecimals={3}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, federal_marginal_rate: v },
              }))
            }
          />
          <PctField
            label="State marginal"
            tip={BBD_FIELD_TIPS.taxesStateMarginal}
            unit="% applied to modeled taxable ordinary income · state levy."
            value={scenario.taxes.state_marginal_rate}
            step="0.5"
            displayDecimals={3}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, state_marginal_rate: v },
              }))
            }
          />
          <PctField
            label="LTCG rate"
            tip={BBD_FIELD_TIPS.taxesLtcg}
            unit="% modeled on taxable long-term gains when crystallized."
            value={scenario.taxes.ltcg_rate}
            step="1"
            displayDecimals={4}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, ltcg_rate: v },
              }))
            }
          />
          <PctField
            label="NIIT surcharge"
            tip={BBD_FIELD_TIPS.taxesNiit}
            unit="Net Investment Income Tax style % modeled on MAGI thresholds."
            value={scenario.taxes.niit_rate}
            step="0.1"
            displayDecimals={6}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                taxes: { ...s.taxes, niit_rate: v },
              }))
            }
          />
          <PctField
            label="Depreciation recapture slice"
            tip={BBD_FIELD_TIPS.taxesDepreciationRecapture}
            unit="% haircut on depreciation recapture at modeled sale/disposition."
            value={scenario.taxes.depreciation_recapture_rate}
            step="1"
            displayDecimals={3}
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
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Borrowing & rates (SBLOC, HELOC, refi caps)</span>
          <BbdDocsSectionLink section="borrowing" />
        </summary>
        <p className="mt-3 mb-4 text-[11px] leading-relaxed text-slate-500">
          SOFR-heavy lines are nominal annual percentages. Anything labeled{' '}
          <span className="font-semibold text-slate-600">LTV / CLTV</span> expresses loan balance as a
          fraction of the pledged portfolio or modeled property appraisal.
        </p>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <PctField
            label="SBLOC max LTV"
            tip={BBD_FIELD_TIPS.borrowSblocMaxLtv}
            unit="Borrowings divided by pledged taxable portfolio earmarked SBLOC collateral."
            value={scenario.borrowing.sbloc_ltv_cap}
            step="5"
            displayDecimals={2}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sbloc_ltv_cap: v },
              }))
            }
          />
          <PctField
            label="SBLOC margin-call LTV"
            tip={BBD_FIELD_TIPS.borrowSblocMarginLtv}
            unit="Borrowings / collateral triggering modeled liquidation event."
            value={scenario.borrowing.sbloc_margin_call_ltv}
            step="5"
            displayDecimals={2}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sbloc_margin_call_ltv: v },
              }))
            }
          />
          <PctField
            label="SBLOC spread above SOFR"
            tip={BBD_FIELD_TIPS.borrowSblocSpreadOverSofr}
            unit="Additive margin on top of modeled annual SOFR (nominal)."
            value={scenario.borrowing.sbloc_spread_over_sofr}
            step="0.1"
            displayDecimals={5}
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
          <PctField
            label="Starting SOFR"
            tip={BBD_FIELD_TIPS.borrowSofrStarting}
            unit="First-year benchmark nominal APR."
            value={scenario.borrowing.sofr_rate}
            step="0.1"
            displayDecimals={5}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, sofr_rate: v },
              }))
            }
          />
          <PctField
            label="SOFR long-run mean"
            tip={BBD_FIELD_TIPS.borrowSofrLongRunMean}
            unit="Anchoring rate for stochastic mean-reversion."
            value={scenario.borrowing.sofr_long_run}
            step="0.1"
            displayDecimals={5}
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
            label="Rate mean-reversion (speed)"
            tip={BBD_FIELD_TIPS.borrowRateMeanReversion}
            narrow
            step="0.05"
            unit="Higher pushes SOFR faster toward its long-run mean · not itself a percentage."
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
          <PctField
            label="HELOC spread vs prime"
            tip={BBD_FIELD_TIPS.borrowHelocSpreadOverPrime}
            unit="Additive margin over modeled prime APR on HELOC borrowing."
            value={scenario.borrowing.heloc_rate_spread_over_prime}
            step="0.05"
            displayDecimals={4}
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
          <PctField
            label="Cash-out refi rate"
            tip={BBD_FIELD_TIPS.borrowCashOutRefiRate}
            unit="Nominal annual note rate modeled on leveraged property cash-outs."
            value={scenario.borrowing.cashout_refi_rate}
            step="0.1"
            displayDecimals={4}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, cashout_refi_rate: v },
              }))
            }
          />
          <PctField
            label="HELOC max CLTV"
            tip={BBD_FIELD_TIPS.borrowHelocMaxCltv}
            unit="Combined liens modeled as capped share of appraisal."
            value={scenario.borrowing.heloc_max_cltv}
            step="1"
            displayDecimals={3}
            onCommit={v =>
              setScenario(s => ({
                ...s,
                borrowing: { ...s.borrowing, heloc_max_cltv: v },
              }))
            }
          />
          <PctField
            label="Cash-out max CLTV"
            tip={BBD_FIELD_TIPS.borrowCashOutMaxCltv}
            unit="Investment-property cash-outs capped versus modeled value."
            value={scenario.borrowing.cashout_refi_max_cltv}
            step="1"
            displayDecimals={3}
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
        <SectionTitle docsSection="strategy">Drawdown strategy</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4 mb-3">
          <NumField
            label="Years until borrow phase"
            tip={BBD_FIELD_TIPS.strategyDrawdownLagYears}
            narrow
            unit="Counted from horizon start · full years accumulating before modeled draws."
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
          <MoneyField
            label="Target annual tax-free draw"
            tip={BBD_FIELD_TIPS.strategyTargetAnnualDrawdown}
            unit="Nominal USD per modeled year · tax-free-ish cash goal while borrowing phase live."
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
          <label className="block max-w-[13rem]">
            <FormFieldLabel label="PE exit treatment" tip={BBD_FIELD_TIPS.strategyPeExitTreatment} />
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
            <UnitCaption text="Matches API enum tokens for PE liquidity modeling: cash, stock, hold." />
          </label>
        </div>
        <div className="flex flex-wrap gap-6 mb-4">
          <CheckField
            label="Capitalize interest on borrowing"
            tip={BBD_FIELD_TIPS.strategyCapitalizeInterest}
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
            tip={BBD_FIELD_TIPS.strategyInflateDrawdown}
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
            tip={BBD_FIELD_TIPS.strategyConvertPrimary}
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
            tip={BBD_FIELD_TIPS.strategyConvertYear}
            narrow
            unit="Gregorian calendar year modeled for flipping primary-use to rental income."
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
        <SectionTitle docsSection="properties">Properties</SectionTitle>
        <p className="text-[11px] text-slate-500 mb-3 max-w-[48rem]">
          Dollar balances are nominal USD. Anything labeled{' '}
          <span className="font-semibold text-slate-600">Monthly</span> repeats each calendar month; annual
          drivers use percentages next to each control.
        </p>
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
                <FormFieldLabel label="Name" tip={BBD_FIELD_TIPS.propertyDisplayName} />
                <input
                  type="text"
                  value={row.name}
                  onChange={e => pn(prev => ({ ...prev, name: e.target.value }), idx)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <CheckField
                label="Primary residence"
                tip={BBD_FIELD_TIPS.propertyPrimaryResidence}
                checked={row.is_primary}
                onChange={v =>
                  pn(pr => ({ ...pr, is_primary: v }), idx)
                }
              />
              <div className="grid md:grid-cols-4 gap-3">
                <MoneyField
                  label="Purchase price"
                  tip={BBD_FIELD_TIPS.propertyPurchasePrice}
                  unit="Historical trade value · nominal USD at purchase date."
                  value={row.purchase_price}
                  onCommit={v => pn(pr => ({ ...pr, purchase_price: v }), idx)}
                />
                <NumField
                  label="Purchase year"
                  tip={BBD_FIELD_TIPS.propertyPurchaseYear}
                  narrow
                  unit="Gregorian calendar year modeled for acquiring the deed."
                  value={row.purchase_year}
                  onCommit={v => pn(pr => ({ ...pr, purchase_year: Math.round(v) }), idx)}
                />
                <MoneyField
                  label="Current value"
                  tip={BBD_FIELD_TIPS.propertyCurrentValue}
                  unit="Nominal modeled appraisal/mark at projection start."
                  value={row.current_value}
                  onCommit={v => pn(pr => ({ ...pr, current_value: v }), idx)}
                />
                <MoneyField
                  label="Mortgage balance"
                  tip={BBD_FIELD_TIPS.propertyMortgageBalance}
                  unit="Principal remaining · nominal USD at projection start."
                  value={row.mortgage_balance}
                  onCommit={v => pn(pr => ({ ...pr, mortgage_balance: v }), idx)}
                />
                <PctField
                  label="Mortgage APR"
                  tip={BBD_FIELD_TIPS.propertyMortgageApr}
                  unit="Annual nominal rate on amortizing lien."
                  value={row.mortgage_rate}
                  step="0.1"
                  displayDecimals={5}
                  onCommit={v => pn(pr => ({ ...pr, mortgage_rate: v }), idx)}
                />
                <NumField
                  label="Mortgage term (years)"
                  tip={BBD_FIELD_TIPS.propertyMortgageTermYears}
                  narrow
                  unit="Whole years on original amortization schedule."
                  value={row.mortgage_term_years}
                  onCommit={v =>
                    pn(pr => ({ ...pr, mortgage_term_years: Math.max(1, Math.round(v)) }), idx)}
                />
                <NumField
                  label="Mortgage start year"
                  tip={BBD_FIELD_TIPS.propertyMortgageStartYear}
                  narrow
                  unit="Calendar year the modeled note began amortizing."
                  value={row.mortgage_origination_year}
                  onCommit={v =>
                    pn(pr => ({
                      ...pr,
                      mortgage_origination_year: Math.round(v),
                    }), idx)}
                />
                <MoneyField
                  label="Monthly PITI"
                  tip={BBD_FIELD_TIPS.propertyMonthlyPiti}
                  unit="Nominal USD per calendar month · principal+interest+taxes+insurance bundle."
                  value={row.monthly_piti}
                  onCommit={v => pn(pr => ({ ...pr, monthly_piti: v }), idx)}
                />
                <MoneyField
                  label="Monthly market rent"
                  tip={BBD_FIELD_TIPS.propertyMonthlyMarketRent}
                  unit="Comparable rent · nominal USD per month at projection start."
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
                    tip={BBD_FIELD_TIPS.propertyRentalStartYear}
                    narrow
                    unit="Gregorian calendar year rents begin accruing toward NOI (0 blanks it)."
                    value={row.rental_start_year ?? 0}
                    onCommit={v => {
                      const y = Math.round(v)
                      pn(pr => ({
                        ...pr,
                        rental_start_year: y <= 0 ? null : y,
                      }), idx)
                    }}
                  />
                  <PctField
                    label="Appreciation (%/yr)"
                    tip={BBD_FIELD_TIPS.propertyAppreciation}
                    unit="Growth on modeled property resale value annually."
                    value={row.appreciation_rate}
                    step="0.1"
                    displayDecimals={4}
                    onCommit={v => pn(pr => ({ ...pr, appreciation_rate: v }), idx)}
                  />
                  <PctField
                    label="Rent growth"
                    tip={BBD_FIELD_TIPS.propertyRentGrowth}
                    unit="Growth on modeled market rent assumptions once leased."
                    value={row.rent_growth_rate}
                    step="0.1"
                    displayDecimals={4}
                    onCommit={v => pn(pr => ({ ...pr, rent_growth_rate: v }), idx)}
                  />
                  <PctField
                    label="Vacancy + mgmt"
                    tip={BBD_FIELD_TIPS.propertyVacancyMgmt}
                    unit="% of modeled gross rents lost to vacancy and property-management drag."
                    value={row.vacancy_and_mgmt_pct}
                    step="0.5"
                    displayDecimals={3}
                    onCommit={v => pn(pr => ({ ...pr, vacancy_and_mgmt_pct: v }), idx)}
                  />
                  <PctField
                    label="Maintenance / value"
                    tip={BBD_FIELD_TIPS.propertyMaintenanceVsValue}
                    unit="Annual upkeep modeled as fraction of contemporaneous appraisal."
                    value={row.annual_maintenance_pct}
                    step="0.1"
                    displayDecimals={4}
                    onCommit={v => pn(pr => ({ ...pr, annual_maintenance_pct: v }), idx)}
                  />
                  <PctField
                    label="Land (basis allocation)"
                    tip={BBD_FIELD_TIPS.propertyLandBasisPct}
                    unit="Non-depreciable land share of modeled cost basis allocation."
                    value={row.land_value_pct}
                    step="1"
                    displayDecimals={2}
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
        <SectionTitle docsSection="privateEquity">Private equity</SectionTitle>
        <p className="text-[11px] text-slate-500 mb-3 max-w-[48rem]">
          Balances default to nominal USD. Probability lines are modeled chances each simulated year. Exit
          multiples are unitless scaling factors versus the contemporaneous modeled mark.
        </p>
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
                <FormFieldLabel label="Name" tip={BBD_FIELD_TIPS.peDisplayName} />
                <input
                  type="text"
                  value={row.name}
                  onChange={e => pe(prev => ({ ...prev, name: e.target.value }), idx)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <div className="grid md:grid-cols-4 gap-3">
                <MoneyField
                  label="Current value mark"
                  tip={BBD_FIELD_TIPS.peCurrentMark}
                  unit="Fair value / latest round · nominal USD at projection start."
                  value={row.current_value}
                  onCommit={v => pe(pr => ({ ...pr, current_value: v }), idx)}
                />
                <MoneyField
                  label="Cost basis"
                  tip={BBD_FIELD_TIPS.peCostBasis}
                  unit="Modeled statutory basis · nominal USD (often grants/strike-heavy)."
                  value={row.cost_basis}
                  onCommit={v => pe(pr => ({ ...pr, cost_basis: v }), idx)}
                />
                <PctField
                  label="Expected growth (%/yr)"
                  tip={BBD_FIELD_TIPS.peExpectedGrowthRate}
                  unit="Growth applied to modeled private-equity valuation each simulated year."
                  value={row.expected_growth_rate}
                  step="0.5"
                  displayDecimals={4}
                  onCommit={v => pe(pr => ({ ...pr, expected_growth_rate: v }), idx)}
                />
                <PctField
                  label="Volatility (σ)"
                  tip={BBD_FIELD_TIPS.peVolatilityAnnual}
                  unit="Swinginess of modeled private-equity returns on an annual horizon."
                  value={row.volatility}
                  step="0.5"
                  displayDecimals={3}
                  onCommit={v => pe(pr => ({ ...pr, volatility: v }), idx)}
                />
                <PctField
                  label="Annual failure prob."
                  tip={BBD_FIELD_TIPS.peAnnualFailureProbability}
                  unit="Modeled chance each simulated year leaves the stake worthless."
                  value={row.annual_failure_prob}
                  step="0.5"
                  displayDecimals={4}
                  onCommit={v => pe(pr => ({ ...pr, annual_failure_prob: v }), idx)}
                />
                <PctField
                  label="Annual exit prob."
                  tip={BBD_FIELD_TIPS.peAnnualExitProbability}
                  unit="Modeled chance each simulated year triggers modeled liquidity mechanics."
                  value={row.annual_exit_prob}
                  step="0.5"
                  displayDecimals={4}
                  onCommit={v => pe(pr => ({ ...pr, annual_exit_prob: v }), idx)}
                />
                <NumField
                  label="Exit multiple mean"
                  tip={BBD_FIELD_TIPS.peExitMultipleMean}
                  step="0.1"
                  unit="Plain multiple (unitless): modeled proceeds factor before randomness draws."
                  value={row.exit_multiple_mean}
                  onCommit={v => pe(pr => ({ ...pr, exit_multiple_mean: v }), idx)}
                />
                <NumField
                  label="Exit multiple σ"
                  tip={BBD_FIELD_TIPS.peExitMultipleVol}
                  step="0.1"
                  unit="Spread describing how modeled exit multiples wobble around that mean."
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
