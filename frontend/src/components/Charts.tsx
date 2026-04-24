import { useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import type { Metrics } from '../types'

const COLORS = [
  '#0d9488', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#f97316', '#06b6d4', '#ec4899', '#84cc16',
  '#a78bfa', '#fb923c', '#34d399', '#60a5fa', '#f472b6',
]

function usd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ── Category donut ──────────────────────────────────────────────────────────
function CategoryPie({ metrics }: { metrics: Metrics }) {
  const data = Object.entries(metrics.by_category).map(([name, value]) => ({ name, value }))
  if (!data.length) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [usd(v), 'Amount']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Category bar ────────────────────────────────────────────────────────────
function CategoryBar({ metrics }: { metrics: Metrics }) {
  const data = Object.entries(metrics.by_category)
    .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, value }))
  if (!data.length) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24 }}>
        <XAxis
          type="number"
          tickFormatter={usd}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [usd(v), 'Amount']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Daily trend ─────────────────────────────────────────────────────────────
function TrendChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.daily_trend.map(([date, amount]) => ({ date, amount }))
  if (!data.length) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ left: 8, right: 8 }}>
        <defs>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={d => d.slice(5)}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={usd}
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(v: number) => [usd(v), 'Spent']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#0d9488"
          strokeWidth={2}
          fill="url(#tealGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Top merchants ───────────────────────────────────────────────────────────
function MerchantChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.top_merchants.map(([name, value]) => ({
    name: name.length > 22 ? name.slice(0, 20) + '…' : name,
    value,
  }))
  if (!data.length) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24 }}>
        <XAxis
          type="number"
          tickFormatter={usd}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [usd(v), 'Amount']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-slate-400">
      No data yet
    </div>
  )
}

type SpendPeriod = 'week' | 'month'

function CategorySpendTrend({ metrics }: { metrics: Metrics }) {
  const categories = Object.keys(metrics.by_category)
  const [period, setPeriod] = useState<SpendPeriod>('month')
  const [picked, setPicked] = useState<string | null>(null)
  const category =
    picked && categories.includes(picked) ? picked : (categories[0] ?? '')

  const trendMap =
    period === 'week' ? metrics.category_weekly_trend : metrics.category_monthly_trend
  const raw = category ? trendMap[category] ?? [] : []
  const data = raw.map(([periodLabel, amount]) => ({ period: periodLabel, amount }))

  if (!categories.length) return <EmptyChart />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium uppercase tracking-wider">Category</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={category}
            onChange={e => setPicked(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              period === 'month'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setPeriod('month')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              period === 'week'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setPeriod('week')}
          >
            Weekly
          </button>
        </div>
      </div>

      {!data.length ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ left: 8, right: 8 }}>
            <defs>
              <linearGradient id="categoryTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={usd}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(v: number) => [usd(v), 'Spent']}
              labelFormatter={l => (period === 'week' ? `Week ${l}` : `Month ${l}`)}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#categoryTrendGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ── Composed export ─────────────────────────────────────────────────────────
interface Props {
  metrics: Metrics | undefined
  loading: boolean
}

export function Charts({ metrics, loading }: Props) {
  if (loading || !metrics) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-72 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-64 animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-64 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-72 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Spending by Category">
          <CategoryPie metrics={metrics} />
        </Card>
        <Card title="Category Amounts">
          <CategoryBar metrics={metrics} />
        </Card>
      </div>

      <Card title="Daily Spend Trend">
        <TrendChart metrics={metrics} />
      </Card>

      <Card title="Category Spend Trend">
        <CategorySpendTrend metrics={metrics} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Top 10 Merchants">
          <MerchantChart metrics={metrics} />
        </Card>
        <CategoryTable metrics={metrics} />
      </div>
    </div>
  )
}

// ── Category summary table ──────────────────────────────────────────────────
function CategoryTable({ metrics }: { metrics: Metrics }) {
  const total = metrics.total_spent
  const rows = Object.entries(metrics.by_category)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
        Category Summary
      </h2>
      <div className="overflow-auto max-h-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="pb-2 pr-4">Category</th>
              <th className="pb-2 pr-4 text-right">#</th>
              <th className="pb-2 pr-4 text-right">Total</th>
              <th className="pb-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([cat, amt]) => {
              const pct = total ? (amt / total * 100).toFixed(1) : '0.0'
              const count = metrics.by_category_count[cat] ?? 0
              return (
                <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-1.5 pr-4 text-slate-700">{cat}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-slate-500">{count}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums font-medium">{usd(amt)}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-400">{pct}%</td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
