/**
 * Derive plan-level inflow/outflow labels from the cash-flow graph document.
 *
 * See Also: docs/design/budget-cash-flow-graph.md
 */

import type { CashFlowGraphDocument, CashFlowNodeSpec } from '../types'

import { graphNodeRefForPaymentMethod, PAYMENT_METHOD_LABELS, type PaymentMethod } from './budgetAllocation'

function nodeMap(doc: CashFlowGraphDocument): Map<string, CashFlowNodeSpec> {
  return new Map(doc.nodes.map(n => [n.ref, n]))
}

function edgePhrase(m: Map<string, CashFlowNodeSpec>, fromRef: string, toRef: string): string {
  const from = m.get(fromRef)?.display_name?.trim() || fromRef
  const to = m.get(toRef)?.display_name?.trim() || toRef
  return `${from} → ${to}`
}

/** Account name covering an allocation line (matches graph node when present). */
export function coverageAccountLabelFromGraph(
  pm: PaymentMethod,
  graph: CashFlowGraphDocument | null | undefined,
): string {
  const ref = graphNodeRefForPaymentMethod(pm)
  const n = graph?.nodes.find(x => x.ref === ref)
  const name = n?.display_name?.trim()
  return name || PAYMENT_METHOD_LABELS[pm]
}

/**
 * Classify graph edges into inflows vs outflows for a plain-language list.
 *
 * Inflows: income into the system, or savings into checking.
 * Outflows: money leaving checking or leaving a card (liability) to another node.
 */
export function planMoneyFlowPhrases(graph: CashFlowGraphDocument | undefined): {
  inflows: string[]
  outflows: string[]
} {
  if (!graph?.edges?.length || !graph.nodes.length) return { inflows: [], outflows: [] }

  const m = nodeMap(graph)
  const inflows: string[] = []
  const outflows: string[] = []

  for (const e of graph.edges) {
    const fk = m.get(e.from_ref)?.kind
    const tk = m.get(e.to_ref)?.kind
    if (!fk || !tk) continue

    if (fk === 'income_source') {
      inflows.push(edgePhrase(m, e.from_ref, e.to_ref))
      continue
    }
    if (fk === 'savings' && tk === 'checking') {
      inflows.push(edgePhrase(m, e.from_ref, e.to_ref))
      continue
    }

    if (fk === 'checking' && tk !== 'income_source') {
      outflows.push(edgePhrase(m, e.from_ref, e.to_ref))
      continue
    }
    if (fk === 'liability_surrogate') {
      outflows.push(edgePhrase(m, e.from_ref, e.to_ref))
    }
  }

  return { inflows, outflows }
}
