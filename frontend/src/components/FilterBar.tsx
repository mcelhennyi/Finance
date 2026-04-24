import { useQuery } from '@tanstack/react-query'
import type { FilterState } from '../types'
import { api } from '../api/client'
import {
  calendarMonthBounds,
  previousMonthYm,
  thisMonthYm,
  ymFromFullMonthRange,
} from '../lib/monthRange'

interface Props {
  filter: FilterState
  onChange: (f: FilterState) => void
  onApply: () => void
  onReset: () => void
  /** Replace date range and fetch immediately (keeps category / bank). */
  onApplyDateRange: (from: string, to: string) => void
  /** Clear date filters and fetch immediately. */
  onClearDates: () => void
}

const chip =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors'

export function FilterBar({
  filter,
  onChange,
  onApply,
  onReset,
  onApplyDateRange,
  onClearDates,
}: Props) {
  const { data: filters } = useQuery({
    queryKey: ['filters'],
    queryFn: api.filters,
  })

  const set = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filter, [key]: e.target.value })

  const monthMin = filters?.date_min?.slice(0, 7)
  const monthMax = filters?.date_max?.slice(0, 7)
  const monthValue = ymFromFullMonthRange(filter.from, filter.to)

  const applyYm = (ym: string) => {
    const { from, to } = calendarMonthBounds(ym)
    if (!from || !to) return
    onApplyDateRange(from, to)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 flex flex-wrap items-end gap-4">
      <Field label="Month">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={monthValue}
            min={monthMin ?? undefined}
            max={monthMax ?? undefined}
            onChange={e => {
              const v = e.target.value
              if (v) applyYm(v)
            }}
            className={`${input} min-w-[150px]`}
          />
          <button type="button" className={chip} onClick={() => applyYm(thisMonthYm())}>
            This month
          </button>
          <button type="button" className={chip} onClick={() => applyYm(previousMonthYm())}>
            Last month
          </button>
          <button type="button" className={chip} onClick={onClearDates}>
            All dates
          </button>
        </div>
      </Field>

      <Field label="From">
        <input
          type="date"
          value={filter.from}
          onChange={set('from')}
          className={input}
        />
      </Field>

      <Field label="To">
        <input
          type="date"
          value={filter.to}
          onChange={set('to')}
          className={input}
        />
      </Field>

      <Field label="Category">
        <select value={filter.category} onChange={set('category')} className={input}>
          <option value="">All categories</option>
          {filters?.categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Bank">
        <select value={filter.source} onChange={set('source')} className={input}>
          <option value="">All banks</option>
          {filters?.sources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <div className="flex gap-2 self-end">
        <button
          onClick={onApply}
          className="rounded-lg bg-teal-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="rounded-lg bg-slate-100 text-slate-600 px-4 py-1.5 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </div>
  )
}

const input =
  'rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]'
