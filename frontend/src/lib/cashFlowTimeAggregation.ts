/**
 * Client-side aggregation for cash-flow graph edges (T-FR-0006-05).
 * Heuristic monthly equivalents — not tax/legal advice; for exploration only.
 *
 * See Also: docs/design/budget-cash-flow-graph.md
 */

import type { CashFlowEdgeSpec, CashFlowGraphDocument } from '../types'

export type TimeGrain = 'day' | 'month' | 'year'

export interface AggregationOptions {
  /** Plan monthly income (USD) for percent_of_inflow edges; omit or null if unknown. */
  planIncomeMonthly: number | null
}

export interface NodeFlowTotals {
  inflow: number
  outflow: number
  net: number
}

function parseUsd(s: string | null): number {
  if (s == null || s.trim() === '') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/** Convert edge to approximate USD per month (positive = magnitude of flow along the edge). */
export function edgeMonthlyEquivalentUsd(edge: CashFlowEdgeSpec, opts: AggregationOptions): number {
  const income = opts.planIncomeMonthly != null && opts.planIncomeMonthly > 0 ? opts.planIncomeMonthly : 0
  const fixed = parseUsd(edge.fixed_amount)

  if (edge.amount_rule === 'remainder') {
    return 0
  }

  if (edge.amount_rule === 'percent_of_inflow') {
    const pct = parseUsd(edge.percent_of_inflow)
    if (pct <= 0 || income <= 0) return 0
    const monthlyFromPct = (pct / 100) * income
    return monthlyFromPct
  }

  if (edge.amount_rule === 'fixed') {
    return scaleFixedByCadence(fixed, edge.cadence)
  }

  return 0
}

function scaleFixedByCadence(amount: number, cadence: CashFlowEdgeSpec['cadence']): number {
  if (amount <= 0) return 0
  switch (cadence) {
    case 'daily':
      return amount * (365 / 12)
    case 'weekly':
      return amount * (365 / 7 / 12)
    case 'monthly':
      return amount
    case 'on_date':
      return amount
    default:
      return amount
  }
}

/** Scale monthly USD to the selected reporting grain (exploration rounding). */
export function scaleMonthlyToGrain(monthlyUsd: number, grain: TimeGrain): number {
  switch (grain) {
    case 'day':
      return monthlyUsd / 30
    case 'month':
      return monthlyUsd
    case 'year':
      return monthlyUsd * 12
    default:
      return monthlyUsd
  }
}

/** Per-node inflow/outflow for the grain (sums directed edges). Remainder edges contribute 0 here. */
export function aggregateNodeFlows(
  doc: CashFlowGraphDocument,
  grain: TimeGrain,
  opts: AggregationOptions,
): Record<string, NodeFlowTotals> {
  const refs = new Set(doc.nodes.map(n => n.ref))
  const acc: Record<string, NodeFlowTotals> = {}
  for (const r of refs) {
    acc[r] = { inflow: 0, outflow: 0, net: 0 }
  }

  for (const e of doc.edges) {
    if (!refs.has(e.from_ref) || !refs.has(e.to_ref)) continue
    const mag = scaleMonthlyToGrain(edgeMonthlyEquivalentUsd(e, opts), grain)
    if (mag <= 0) continue
    acc[e.from_ref].outflow += mag
    acc[e.to_ref].inflow += mag
  }

  for (const r of refs) {
    acc[r].net = acc[r].inflow - acc[r].outflow
  }

  return acc
}
