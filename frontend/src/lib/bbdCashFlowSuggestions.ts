/**
 * Maps BBD projection outputs to proposed cash-flow edges (T-FR-0006-06).
 * Suggestions are not persisted until the operator saves the graph.
 *
 * DESIGN-GAP: Uses year-one schedule heuristics only; refine when projection exposes
 * finer-grained cash-flow line items for mapping.
 *
 * See Also: docs/design/budget-cash-flow-graph.md
 */

import type { BbdRunResponse, CashFlowEdgeSpec, CashFlowNodeSpec } from '../types'

import { newEdgeRef } from './cashFlowGraphFlow'

export interface SuggestionMeta {
  rationale: string
}

/** Build proposed edges from the first projection year and existing node kinds. */
export function suggestedEdgesFromBbdResponse(
  response: BbdRunResponse,
  nodes: CashFlowNodeSpec[],
): { edges: CashFlowEdgeSpec[]; meta: SuggestionMeta[] } {
  const schedule = response.schedule
  if (!schedule.length || !nodes.length) {
    return { edges: [], meta: [] }
  }

  const findKind = (k: CashFlowNodeSpec['kind']) => nodes.find(n => n.kind === k)

  const portfolio =
    findKind('brokerage_cash') ?? findKind('external_pooled') ?? findKind('savings')
  const checking = findKind('checking')
  const liability = findKind('liability_surrogate')
  const income = findKind('income_source')

  const y0 = schedule[0]
  const edges: CashFlowEdgeSpec[] = []
  const meta: SuggestionMeta[] = []

  if (portfolio && checking && y0.portfolio_dividends > 0) {
    const monthly = y0.portfolio_dividends / 12
    const ref = newEdgeRef(portfolio.ref, checking.ref)
    edges.push({
      ref,
      from_ref: portfolio.ref,
      to_ref: checking.ref,
      label: 'BBD: portfolio dividends (y1 ÷ 12)',
      amount_rule: 'fixed',
      fixed_amount: monthly.toFixed(2),
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    })
    meta.push({
      rationale: 'Uses first simulation year portfolio_dividends as a monthly dividend sweep suggestion.',
    })
  }

  if (checking && liability && y0.drawdown_borrowed > 0) {
    const ref = newEdgeRef(checking.ref, liability.ref)
    edges.push({
      ref,
      from_ref: checking.ref,
      to_ref: liability.ref,
      label: 'BBD: securities-based borrow (y1)',
      amount_rule: 'fixed',
      fixed_amount: (y0.drawdown_borrowed / 12).toFixed(2),
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    })
    meta.push({
      rationale: 'Uses first year drawdown_borrowed as an illustrative liability-service flow (÷12).',
    })
  }

  if (income && checking && y0.gross_cash_income > 0 && !edges.some(e => e.from_ref === income.ref)) {
    const ref = newEdgeRef(income.ref, checking.ref)
    edges.push({
      ref,
      from_ref: income.ref,
      to_ref: checking.ref,
      label: 'BBD: gross cash income hint (y1 ÷ 12)',
      amount_rule: 'fixed',
      fixed_amount: (y0.gross_cash_income / 12).toFixed(2),
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    })
    meta.push({
      rationale: 'Uses gross_cash_income from year 1 as a coarse payroll/deposit hint.',
    })
  }

  return { edges, meta }
}
