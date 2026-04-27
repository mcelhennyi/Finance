import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { api } from '../api/client'
import { firstOfMonthFromYm, thisMonthYm } from '../lib/monthRange'
import { collectDerivedBudgetSignals } from '../lib/unifiedAlerts'
import type { UnifiedViewSummary } from '../types'

function usd(n: number) {
  return (
    (n < 0 ? '−' : '') +
    '$' +
    Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )
}

function Kpi({ label, value, sub, tone = 'text-slate-800' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3 min-h-[5.5rem]">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">{children}</h2>
  )
}

function summaryIsEffectivelyEmpty(s: UnifiedViewSummary) {
  const c = s.card_cash_flow
  return (
    s.budgets.length === 0 &&
    s.goals.length === 0 &&
    c.transaction_count === 0 &&
    s.contracts.active_income_count === 0 &&
    s.contracts.active_liability_count === 0
  )
}

export function UnifiedViewPage() {
  const [ym, setYm] = useState(thisMonthYm)
  const [asOf, setAsOf] = useState('')

  const monthParam = firstOfMonthFromYm(ym) || `${ym}-01`
  const asOfParam = asOf.trim() || undefined

  const q = useQuery({
    queryKey: ['unifiedViewSummary', monthParam, asOfParam ?? ''],
    queryFn: () => api.unifiedViewSummary(monthParam, asOfParam),
  })

  const data = q.data
  const err = q.error instanceof Error ? q.error.message : q.error != null ? String(q.error) : null
  const derivedSignals = data ? collectDerivedBudgetSignals(data.budgets) : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Unified financial view</h1>
        <p className="text-sm text-slate-500 mt-1">
          Phase 2 summary: goals, budgets, card cash flow, income and liabilities, and net worth in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">Month</span>
          <input
            type="month"
            value={ym}
            onChange={e => setYm(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">As of (optional)</span>
          <input
            type="date"
            value={asOf}
            onChange={e => setAsOf(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>
        {data && (
          <span className="text-xs text-slate-400 pb-2">
            API period: {data.period_month} · as_of {data.as_of}
          </span>
        )}
      </div>

      {q.isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {q.isError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <strong className="font-semibold">Could not load summary.</strong> {err}
        </div>
      )}

      {data && !q.isLoading && !q.isError && (
        <>
          {summaryIsEffectivelyEmpty(data) && (
            <p className="text-sm text-slate-500 rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3">
              No card activity, goals, budgets, or contract income/liabilities for this month. Ingest
              data or add records under Parameters to see this view fill in.
            </p>
          )}

          <div>
            <SectionTitle>Operating & cash flow</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Kpi
                label="Contract income (month)"
                value={usd(data.contracts.total_income)}
                sub={`${data.contracts.active_income_count} line(s)`}
                tone="text-emerald-600"
              />
              <Kpi label="Card charges" value={usd(data.card_cash_flow.total_charges)} tone="text-red-500" />
              <Kpi label="Card credits" value={usd(data.card_cash_flow.total_credits)} tone="text-green-600" />
              <Kpi
                label="Net charged (card)"
                value={usd(data.card_cash_flow.net_spent)}
                sub={`${data.card_cash_flow.transaction_count} txns`}
              />
              <Kpi
                label="Operating (income + credits − charges)"
                value={usd(data.reconciliation.unified_operating_net)}
                sub={
                  data.reconciliation.within_tolerance
                    ? 'Reconciliation within USD 10'
                    : `Check: Δ ${usd(data.reconciliation.discrepancy)}`
                }
                tone={data.reconciliation.within_tolerance ? 'text-slate-800' : 'text-amber-700'}
              />
            </div>
          </div>

          <div>
            <SectionTitle>Alerts and signals</SectionTitle>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                Derived from budget actuals (trending / over). Persisted alert history will appear here
                when the alerts service is available.
              </div>
              {derivedSignals.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No over-budget or pacing signals for this month.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {derivedSignals.map((s, i) => (
                    <li key={i} className="px-4 py-3 flex justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-800">{s.category}</span>
                      <span
                        className={
                          s.kind === 'over_budget' ? 'text-red-600 font-medium' : 'text-amber-700'
                        }
                      >
                        {s.kind === 'over_budget' ? 'Over budget' : 'Trending over'} — {s.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <SectionTitle>Goals</SectionTitle>
            {data.goals.length === 0 ? (
              <p className="text-sm text-slate-500">No goals for this month.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-2 font-semibold">Goal</th>
                      <th className="px-4 py-2 font-semibold">Type</th>
                      <th className="px-4 py-2 font-semibold text-right">Target</th>
                      <th className="px-4 py-2 font-semibold text-right">Actual</th>
                      <th className="px-4 py-2 font-semibold text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.goals.map(g => (
                      <tr key={g.goal_id}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{g.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{g.goal_type}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{usd(g.target)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-teal-700">{usd(g.actual)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={
                              g.is_complete ? 'text-emerald-600 font-medium' : 'text-slate-600 tabular-nums'
                            }
                          >
                            {(g.progress_ratio * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <SectionTitle>Budget variance</SectionTitle>
            {data.budgets.length === 0 ? (
              <p className="text-sm text-slate-500">No budgets for this month.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-2 font-semibold">Category</th>
                      <th className="px-4 py-2 font-semibold text-right">Limit</th>
                      <th className="px-4 py-2 font-semibold text-right">Actual</th>
                      <th className="px-4 py-2 font-semibold text-right">Variance</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.budgets.map(b => (
                      <tr key={b.budget_id}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{b.category}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{usd(b.budget_amount)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{usd(b.actual)}</td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums ${
                            b.variance > 0 ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {usd(b.variance)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {b.is_over_budget && <span className="text-red-600 font-medium">Over · </span>}
                          {b.trending_over_budget && b.is_incomplete_month && (
                            <span className="text-amber-700 font-medium">Trending · </span>
                          )}
                          {b.is_incomplete_month ? 'Month in progress' : 'Closed month'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <SectionTitle>Net worth snapshot</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Kpi
                label="Assets (tracked)"
                value={data.net_worth.assets_tracked ? usd(data.net_worth.assets_total) : '—'}
                sub={data.net_worth.assets_tracked ? undefined : 'Not modeled yet; placeholder 0'}
              />
              <Kpi
                label="Liabilities (contracts)"
                value={usd(data.net_worth.liabilities_total)}
                sub={`${data.net_worth.liability_line_items.length} active in range`}
                tone="text-rose-700"
              />
              <Kpi label="Net worth" value={usd(data.net_worth.net_worth)} sub="assets − liabilities" />
            </div>
            {data.net_worth.liability_line_items.length > 0 && (
              <div className="mt-3 overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-2 font-semibold">Name</th>
                      <th className="px-4 py-2 font-semibold">Type</th>
                      <th className="px-4 py-2 font-semibold text-right">Principal</th>
                      <th className="px-4 py-2 font-semibold">As of</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.net_worth.liability_line_items.map(row => (
                      <tr key={row.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{row.liability_type}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{usd(row.principal_amount)}</td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {row.as_of_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-200 pt-4">
            Reconciliation: income aggregate vs. line items Δ{' '}
            {usd(data.reconciliation.income_aggregate_vs_line_items)} ·
            {data.reconciliation.within_tolerance_income ? ' OK' : ' review'}
            {' · '}
            {format(new Date(), 'PPpp')}
          </div>
        </>
      )}
    </div>
  )
}
