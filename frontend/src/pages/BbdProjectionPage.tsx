import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../api/client'
import type { BbdRunPayload, BbdRunResponse } from '../types'

const DEFAULT_SCENARIO_EDITOR = JSON.stringify(
  {
    timing: { start_year: 2026, horizon_years: 20, current_age: 35 },
    income: {
      w2_gross_income: 190_000,
      w2_growth_rate: 0.03,
      w2_retire_year_offset: 30,
    },
    savings: {
      annual_401k_contribution: 23_000,
      employer_match: 9_500,
      starting_taxable_portfolio: 120_000,
      starting_portfolio_basis: 100_000,
      portfolio_nominal_return: 0.085,
      portfolio_volatility: 0.16,
      portfolio_dividend_yield: 0.015,
    },
    expenses: {
      annual_living_expenses: 90_000,
      expense_inflation: 0.03,
    },
    strategy: {
      drawdown_start_year_offset: 18,
      target_annual_drawdown: 80_000,
      capitalize_interest: true,
      inflate_drawdown: true,
      pe_exit_treatment: 'cash',
    },
    properties: [
      {
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
      },
    ],
    private_equity: [
      {
        name: 'Startup equity',
        current_value: 50_000,
        cost_basis: 0,
        expected_growth_rate: 0.15,
        volatility: 0.55,
        annual_failure_prob: 0.06,
        annual_exit_prob: 0.08,
        exit_multiple_mean: 2.5,
        exit_multiple_vol: 1.5,
      },
    ],
  },
  null,
  2,
)

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

export function BbdProjectionPage() {
  const [scenarioText, setScenarioText] = useState(DEFAULT_SCENARIO_EDITOR)
  const [mcTrials, setMcTrials] = useState('0')
  const [parseError, setParseError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: BbdRunPayload) => api.bbdProjectionRun(payload),
  })

  const scheduleRows = mutation.data?.schedule ?? []
  const displayRows = useMemo(() => {
    if (!scheduleRows.length) return []
    const out: typeof scheduleRows = []
    for (let i = 0; i < scheduleRows.length; i++) {
      if (i % 5 === 0 || i === scheduleRows.length - 1) out.push(scheduleRows[i])
    }
    return out
  }, [scheduleRows])

  const runProjection = () => {
    setParseError(null)
    let scenario: Record<string, unknown>
    try {
      scenario = JSON.parse(scenarioText) as Record<string, unknown>
    } catch {
      setParseError('Scenario must be valid JSON.')
      return
    }
    const trials = Number.parseInt(mcTrials, 10)
    if (Number.isNaN(trials) || trials < 0) {
      setParseError('Monte Carlo trials must be a non-negative integer.')
      return
    }
    mutation.mutate({
      scenario,
      ...(trials === 0 ? {} : { monte_carlo_trials: trials, monte_carlo_seed: 42 }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <strong className="font-semibold">Disclaimer.</strong>{' '}
        This projection is illustrative and depends on simplifying assumptions about taxes,
        borrowing, securities, property, and private equity — not individualized advice. Outputs
        are not recommendations to buy or sell securities or real estate.
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Buy · Borrow · Die projection
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Paste a scenario JSON matching the API (timing, income, taxes, expenses, savings,
            borrowing, strategy, plus optional properties and private_equity). Use the CLI in{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">scripts/bbd_projection.py</code> for
            TOML workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="bbd-mc-trials" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Monte Carlo trials (0 = deterministic only)
            </label>
            <input
              id="bbd-mc-trials"
              type="number"
              min={0}
              value={mcTrials}
              onChange={e => setMcTrials(e.target.value)}
              className="mt-1 w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={runProjection}
            disabled={mutation.isPending}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 shrink-0"
          >
            {mutation.isPending ? 'Running…' : 'Run projection'}
          </button>
        </div>

        {(parseError || mutation.isError) && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">
            {parseError ??
              (mutation.error instanceof Error ? mutation.error.message : 'Request failed.')}
          </div>
        )}

        <div>
          <label htmlFor="bbd-scenario" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Scenario JSON
          </label>
          <textarea
            id="bbd-scenario"
            spellCheck={false}
            rows={22}
            value={scenarioText}
            onChange={e => setScenarioText(e.target.value)}
            className="mt-1 w-full font-mono text-xs leading-relaxed rounded-lg border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/70"
          />
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900"
            onClick={() => {
              setScenarioText(DEFAULT_SCENARIO_EDITOR)
              setParseError(null)
            }}
          >
            Reset to sample scenario
          </button>
        </div>
      </section>

      {mutation.data ? <Results data={mutation.data} displayRows={displayRows} /> : null}
    </div>
  )
}

function Results({
  data,
  displayRows,
}: {
  data: BbdRunResponse
  displayRows: BbdRunResponse['schedule']
}) {
  const mc = data.monte_carlo
  return (
    <div className="space-y-6">
      {mc ? (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Monte Carlo summary
          </h2>
          <p className="text-xs text-slate-400">Trials: {mc.n_trials}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-slate-400 text-[11px] uppercase">NW P10</div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p10)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">NW P50</div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p50)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">Margin call rate</div>
              <div className="font-semibold tabular-nums">{(mc.margin_call_rate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">Bankrupt rate</div>
              <div className="font-semibold tabular-nums">{(mc.bankrupt_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Year-by-year (every 5th year + final)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/90 border-b border-slate-100">
                <th className="px-3 py-2 whitespace-nowrap">Year</th>
                <th className="px-3 py-2 whitespace-nowrap">Age</th>
                <th className="px-3 py-2 whitespace-nowrap">NW</th>
                <th className="px-3 py-2 whitespace-nowrap">Portfolio</th>
                <th className="px-3 py-2 whitespace-nowrap">PE</th>
                <th className="px-3 py-2 whitespace-nowrap">RE</th>
                <th className="px-3 py-2 whitespace-nowrap">SBLOC</th>
                <th className="px-3 py-2 whitespace-nowrap">Draw</th>
                <th className="px-3 py-2 whitespace-nowrap">LTV</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <tr key={row.year} className="border-b border-slate-50 hover:bg-slate-50/50 tabular-nums">
                  <td className="px-3 py-2 text-slate-600">{row.year}</td>
                  <td className="px-3 py-2 text-slate-600">{row.age}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{fmtUsd(row.net_worth)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.portfolio_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.pe_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.properties_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.sbloc_balance)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.drawdown_borrowed)}</td>
                  <td className="px-3 py-2">{`${(row.sbloc_ltv * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[data.estate_sell_path, data.estate_bbd_path].map(outcome => (
          <div key={outcome.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">{outcome.label}</h3>
            <dl className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Net to heirs</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">{fmtUsd(outcome.net_to_heirs)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Debt</dt>
                <dd className="tabular-nums">{fmtUsd(outcome.debt_to_repay)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Cap gains tax</dt>
                <dd className="tabular-nums">{fmtUsd(outcome.cap_gains_tax)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <p className="text-xs text-slate-400">
        BBD vs sell-as-you-go heuristic advantage (terminal):{' '}
        <span className="font-semibold text-slate-600 tabular-nums">
          {fmtUsd(data.bbd_net_advantage_vs_sell_path)}
        </span>
      </p>
    </div>
  )
}
