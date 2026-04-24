/** Calendar month helpers for dashboard date filters (YYYY-MM, local time). */

export function calendarMonthBounds(ym: string): { from: string; to: string } {
  const [ys, ms] = ym.split('-')
  const y = Number(ys)
  const m = Number(ms)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return { from: '', to: '' }
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  const from = `${ys}-${pad(m)}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${ys}-${pad(m)}-${pad(lastDay)}`
  return { from, to }
}

/** If `from`/`to` span exactly one full calendar month, return YYYY-MM; otherwise "". */
export function ymFromFullMonthRange(from: string, to: string): string {
  if (!from || !to) return ''
  if (from.slice(0, 7) !== to.slice(0, 7)) return ''
  const ym = from.slice(0, 7)
  const { from: start, to: end } = calendarMonthBounds(ym)
  return from === start && to === end ? ym : ''
}

function formatYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function thisMonthYm(): string {
  return formatYearMonth(new Date())
}

export function previousMonthYm(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return formatYearMonth(d)
}
