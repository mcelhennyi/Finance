import { useMemo } from 'react'

import { buildBbdVizModel } from '../../lib/bbdVizModel'
import type { BbdRunResponse } from '../../types'
import { BbdDocsSectionLink } from './BbdDocsContext'
import { BBD_OUTPUT_TIPS } from './bbdOutputTips'
import { OutputHoverTip } from '../OutputHoverTip'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

export function BbdStoryDashboard({ data }: { data: BbdRunResponse }) {
  const model = useMemo(() => buildBbdVizModel(data), [data])
  const chartRows = useMemo(
    () =>
      model.schedule.map(p => ({
        year: p.year,
        nw: p.netWorth,
        portfolio: p.portfolioValue,
        pe: p.peValue,
        re: p.propertiesValue,
        draw: p.drawdownBorrowed,
        ltvPct: p.sblocLtv * 100,
        assets: p.totalAssets,
        liabilities: p.totalLiabilities,
      })),
    [model.schedule],
  )

  const borrowNote =
    model.borrowHeavyYears.length > 0
      ? `Borrow-heavy modeled years (top-quartile draws): ${model.borrowHeavyYears.slice(0, 8).join(', ')}${model.borrowHeavyYears.length > 8 ? '…' : ''}.`
      : 'No positive borrowing draws in this deterministic path — the “borrow” leg may be inactive or negligible.'

  if (!chartRows.length) return null

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-teal-900">How to read this story</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          The charts below translate the same numbers as the API — net worth trajectory, where wealth sits (portfolio vs PE vs
          real estate), how borrowing and SBLOC LTV evolve, and (when you run trials) how final outcomes spread. This is{' '}
          <strong className="font-medium">scenario math</strong>, not a forecast or tax advice.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white/90 px-3 py-3 text-xs text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-800">Buy</p>
            <p className="mt-1 leading-snug text-slate-600">
              Track illiquid and equity-like marks (PE, RE) versus liquid portfolio — concentration shows up visually before it
              shows up in a single NW headline.
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white/90 px-3 py-3 text-xs text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-800">Borrow</p>
            <p className="mt-1 leading-snug text-slate-600">
              Draws and SBLOC balances fund lifestyle while collateral floats. Watch LTV and margin flags — they are early
              warnings in this simplified engine.
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white/90 px-3 py-3 text-xs text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-800">Die (terminal heuristic)</p>
            <p className="mt-1 leading-snug text-slate-600">
              Estate cards compress decades into a liquidation story at horizon — useful for comparing paths, not for drafting
              documents.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <OutputHoverTip tip={BBD_OUTPUT_TIPS.story.nwTrajectory} dashed={false}>
                Net worth trajectory
              </OutputHoverTip>
            </h2>
            <p className="mt-1 max-w-prose text-xs text-slate-500">{borrowNote}</p>
          </div>
          <BbdDocsSectionLink
            section="outputs"
            label="Outputs guide ›"
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
          />
        </div>
        <div className="h-[280px] w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bbdNwFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                tickFormatter={v => fmtUsd(Number(v))}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                width={56}
              />
              <Tooltip
                formatter={(value: number) => fmtUsd(value)}
                labelFormatter={y => `Year ${y}`}
                contentStyle={{ fontSize: 11 }}
              />
              <Area type="monotone" dataKey="nw" name="Net worth" stroke="#0f766e" fill="url(#bbdNwFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          <OutputHoverTip tip={BBD_OUTPUT_TIPS.story.composition} dashed={false}>
            Wealth composition (portfolio · PE · real estate)
          </OutputHoverTip>
        </h2>
        <div className="h-[280px] w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tickFormatter={v => fmtUsd(Number(v))} tick={{ fontSize: 11 }} stroke="#94a3b8" width={56} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(value: number) => fmtUsd(value)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#0d9488" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pe" name="PE mark" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="re" name="Real estate" stroke="#ea580c" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          <OutputHoverTip tip={BBD_OUTPUT_TIPS.story.leverageDraws} dashed={false}>
            Borrowing draws vs SBLOC LTV (%)
          </OutputHoverTip>
        </h2>
        <div className="h-[300px] w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                yAxisId="left"
                tickFormatter={v => fmtUsd(Number(v))}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                width={56}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={v => `${Number(v).toFixed(0)}%`}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as { draw: number; ltvPct: number }
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow-lg">
                      <div className="font-semibold text-slate-700">{label}</div>
                      <div className="text-slate-600">Draw: {fmtUsd(row.draw)}</div>
                      <div className="text-slate-600">LTV: {row.ltvPct.toFixed(1)}%</div>
                    </div>
                  )
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="draw" name="Annual draw" fill="#99f6e4" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ltvPct"
                name="SBLOC LTV"
                stroke="#be123c"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  )
}
