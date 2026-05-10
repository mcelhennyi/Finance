/**
 * Shared cash-flow graph account kinds and ref validation (Budget map + accounts form).
 *
 * See Also: docs/design/budget-cash-flow-graph.md
 */

import type { CashNodeKind } from '../types'

/** Account / node roles available when editing a plan graph. */
export const CASH_NODE_KIND_OPTIONS: CashNodeKind[] = [
  'income_source',
  'checking',
  'savings',
  'brokerage_cash',
  'external_pooled',
  'liability_surrogate',
  'other',
]

/** Stable id within a plan graph (matches API / backend). */
export const CASH_FLOW_REF_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/

export function isValidCashFlowRef(ref: string): boolean {
  return CASH_FLOW_REF_PATTERN.test(ref.trim())
}
