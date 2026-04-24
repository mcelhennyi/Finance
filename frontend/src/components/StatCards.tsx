import type { Metrics } from '../types'

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface CardProps {
  label: string
  value: string
  color?: string
}

function Card({ label, value, color = 'text-slate-800' }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

interface Props {
  metrics: Metrics | undefined
  loading: boolean
}

export function StatCards({ metrics, loading }: Props) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 h-20 animate-pulse bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card label="Total Spent"       value={fmt(metrics.total_spent)}       color="text-red-500" />
      <Card label="Credits / Refunds" value={fmt(metrics.total_credits)}      color="text-green-500" />
      <Card label="Net Charged"       value={fmt(metrics.net_spent)} />
      <Card label="Transactions"      value={metrics.transaction_count.toLocaleString()} color="text-teal-600" />
      <Card label="Avg / Transaction" value={fmt(metrics.avg_per_transaction)} />
    </div>
  )
}
