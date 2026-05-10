/**
 * Pure transforms from `BbdRunResponse` to chart-ready structures for the BBD experience UI.
 *
 * See Also: tasks/feature-history/FR-0004-bbd-projection-experience/10-design-00-skeleton.md
 */

import type {
  BbdEstateOutcomeRow,
  BbdMonteCarloSummary,
  BbdRunResponse,
  BbdScheduleRow,
} from '../types'

/** One point per simulated calendar year in the API schedule (full resolution). */
export interface ScheduleSeriesPoint {
  year: number
  age: number
  netWorth: number
  portfolioValue: number
  peValue: number
  propertiesValue: number
  totalAssets: number
  totalLiabilities: number
  sblocBalance: number
  drawdownBorrowed: number
  sblocLtv: number
  marginCall: boolean
  grossIncomeDeltaYoy: number | null
  taxesDeltaYoy: number | null
}

export interface EstateBarDatum {
  label: string
  netToHeirs: number
  grossEstate: number
}

/** View-model for dashboards and the spatial scene. */
export interface BbdVizModel {
  schedule: ScheduleSeriesPoint[]
  /** Years whose borrowing draw is in the top quartile of positive draws (empty if no draws). */
  borrowHeavyYears: number[]
  estateBars: EstateBarDatum[]
  monte: BbdMonteCarloSummary | null
  bbdNetAdvantageVsSellPath: number
  /** Min/max for normalizing trajectories in 3D (computed from non-empty schedule). */
  bounds: {
    yearMin: number
    yearMax: number
    nwMin: number
    nwMax: number
  } | null
}

function rowToPoint(row: BbdScheduleRow): ScheduleSeriesPoint {
  return {
    year: row.year,
    age: row.age,
    netWorth: row.net_worth,
    portfolioValue: row.portfolio_value,
    peValue: row.pe_value,
    propertiesValue: row.properties_value,
    totalAssets: row.total_assets,
    totalLiabilities: row.total_liabilities,
    sblocBalance: row.sbloc_balance,
    drawdownBorrowed: row.drawdown_borrowed,
    sblocLtv: row.sbloc_ltv,
    marginCall: row.margin_call,
    grossIncomeDeltaYoy: row.gross_income_delta_yoy,
    taxesDeltaYoy: row.taxes_delta_yoy,
  }
}

function estateToBar(row: BbdEstateOutcomeRow): EstateBarDatum {
  return {
    label: row.label,
    netToHeirs: row.net_to_heirs,
    grossEstate: row.gross_estate,
  }
}

/**
 * Years in the top quartile of positive `drawdown_borrowed` values (borrow-heavy episodes).
 */
function computeBorrowHeavyYears(schedule: ScheduleSeriesPoint[]): number[] {
  const draws = schedule.map(p => p.drawdownBorrowed).filter(d => d > 0)
  if (draws.length === 0) return []
  const sorted = [...draws].sort((a, b) => a - b)
  const qIdx = Math.floor(0.75 * (sorted.length - 1))
  const threshold = sorted[qIdx] ?? sorted[sorted.length - 1]
  return schedule.filter(p => p.drawdownBorrowed >= threshold && p.drawdownBorrowed > 0).map(p => p.year)
}

function computeBounds(schedule: ScheduleSeriesPoint[]) {
  if (!schedule.length) return null
  let yearMin = schedule[0].year
  let yearMax = schedule[0].year
  let nwMin = schedule[0].netWorth
  let nwMax = schedule[0].netWorth
  for (const p of schedule) {
    yearMin = Math.min(yearMin, p.year)
    yearMax = Math.max(yearMax, p.year)
    nwMin = Math.min(nwMin, p.netWorth)
    nwMax = Math.max(nwMax, p.netWorth)
  }
  return { yearMin, yearMax, nwMin, nwMax }
}

/**
 * Derives visualization structures from a projection API response.
 */
export function buildBbdVizModel(res: BbdRunResponse): BbdVizModel {
  const schedule = (res.schedule ?? []).map(rowToPoint)
  return {
    schedule,
    borrowHeavyYears: computeBorrowHeavyYears(schedule),
    estateBars: [res.estate_sell_path, res.estate_bbd_path].map(estateToBar),
    monte: res.monte_carlo,
    bbdNetAdvantageVsSellPath: res.bbd_net_advantage_vs_sell_path,
    bounds: computeBounds(schedule),
  }
}

/**
 * Sample schedule rows for the dense table (every `step` years + final row).
 */
export function sampleScheduleForTable(
  schedule: BbdScheduleRow[],
  step: number,
): BbdScheduleRow[] {
  if (!schedule.length) return []
  const out: BbdScheduleRow[] = []
  for (let i = 0; i < schedule.length; i++) {
    if (i % step === 0 || i === schedule.length - 1) out.push(schedule[i])
  }
  return out
}
