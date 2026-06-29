/**
 * Derives display-only allocation clusters for cash-flow graph account nodes.
 *
 * See Also: tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md
 */

import type { AllocationItem, CashFlowNodeSpec } from '../types'
import type { RoutingBox } from './cashFlowGraphRouting'

export type AllocationClusterFilters = {
  monthlyMin: string
  monthlyMax: string
  cadence: string
  allocationRole: string
  paymentMethod: string
  categorySearch: string
  counterpartySearch: string
  dueDayMin: string
  dueDayMax: string
}

export type AllocationMiniNode = {
  id: string
  item: AllocationItem
  label: string
  detail: string
  roleLabel: 'Source' | 'Sink'
  tone: 'source' | 'sink' | 'owned_sink'
}

export type AccountAllocationCluster = {
  accountRef: string
  totalCount: number
  sourceCount: number
  sinkCount: number
  visibleCount: number
  visibleSourceTotal: number
  visibleExternalSinkTotal: number
  visibleOwnedSinkTotal: number
  miniNodes: AllocationMiniNode[]
}

export const DEFAULT_ALLOCATION_CLUSTER_FILTERS: AllocationClusterFilters = {
  monthlyMin: '',
  monthlyMax: '',
  cadence: '',
  allocationRole: '',
  paymentMethod: '',
  categorySearch: '',
  counterpartySearch: '',
  dueDayMin: '',
  dueDayMax: '',
}

const MINI_NODE_WIDTH = 164
const MINI_NODE_HEIGHT = 74
const MINI_NODE_GAP = 12
const CLUSTER_TOP_GAP = 42
const CLUSTER_HEADER_HEIGHT = 56

function numericFilter(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function includesText(value: string | null | undefined, needle: string): boolean {
  const q = needle.trim().toLocaleLowerCase()
  if (!q) return true
  return (value ?? '').toLocaleLowerCase().includes(q)
}

/** True when the allocation has either endpoint attached to the account ref. */
export function allocationTouchesAccount(item: AllocationItem, accountRef: string): boolean {
  return item.from_account_ref === accountRef || item.to_account_ref === accountRef
}

/** True when a sink allocation stores money in another owned account node. */
export function allocationHasOwnedSinkDestination(item: AllocationItem, accountRefs: Set<string>): boolean {
  return item.allocation_role === 'sink' && item.to_account_ref != null && accountRefs.has(item.to_account_ref)
}

function passesFilters(
  item: AllocationItem,
  filters: AllocationClusterFilters,
): boolean {
  const min = numericFilter(filters.monthlyMin)
  const max = numericFilter(filters.monthlyMax)
  const dueMin = numericFilter(filters.dueDayMin)
  const dueMax = numericFilter(filters.dueDayMax)

  if (min != null && item.monthly_amount < min) return false
  if (max != null && item.monthly_amount > max) return false
  if (filters.cadence && item.cadence !== filters.cadence) return false
  if (filters.allocationRole && item.allocation_role !== filters.allocationRole) return false
  if (filters.paymentMethod && item.payment_method !== filters.paymentMethod) return false
  if (!includesText(item.category, filters.categorySearch)) return false
  if (!includesText(item.counterparty, filters.counterpartySearch)) return false
  if (dueMin != null && (item.due_day == null || item.due_day < dueMin)) return false
  if (dueMax != null && (item.due_day == null || item.due_day > dueMax)) return false

  return true
}

function nodeLabel(ref: string | null, labelByRef: Map<string, string>, fallback: string): string {
  if (!ref) return fallback
  return labelByRef.get(ref) ?? ref
}

/** Label mini-nodes as source/sink primitives with account context. */
export function allocationMiniNodeLabel(
  item: AllocationItem,
  accountRef: string,
  labelByRef: Map<string, string>,
  accountRefs: Set<string>,
): AllocationMiniNode {
  const accountLabel = nodeLabel(accountRef, labelByRef, accountRef)
  const fromLabel = nodeLabel(item.from_account_ref, labelByRef, 'external source')
  const toLabel = nodeLabel(item.to_account_ref, labelByRef, item.counterparty || item.category || 'external destination')
  const ownedSink = allocationHasOwnedSinkDestination(item, accountRefs)
  const roleLabel = item.allocation_role === 'source' ? 'Source' : 'Sink'

  if (item.allocation_role === 'source') {
    return {
      id: `allocation-${item.id}`,
      item,
      label: item.item_name,
      detail: `${fromLabel} -> ${accountLabel}`,
      roleLabel,
      tone: 'source',
    }
  }

  return {
    id: `allocation-${item.id}`,
    item,
    label: item.item_name,
    detail: ownedSink ? `${fromLabel} -> ${toLabel} storage` : `${fromLabel} -> ${toLabel}`,
    roleLabel,
    tone: ownedSink ? 'owned_sink' : 'sink',
  }
}

/** Derive counts, visible mini-nodes, and source/sink totals for one account. */
export function deriveAccountAllocationCluster(params: {
  accountRef: string
  allocations: AllocationItem[]
  filters: AllocationClusterFilters
  accountNodes: CashFlowNodeSpec[]
}): AccountAllocationCluster {
  const labelByRef = new Map(params.accountNodes.map(node => [node.ref, node.display_name || node.ref]))
  const accountRefs = new Set(params.accountNodes.map(node => node.ref))
  const linked = params.allocations.filter(item => allocationTouchesAccount(item, params.accountRef))
  const visible = linked.filter(item => passesFilters(item, params.filters))

  return {
    accountRef: params.accountRef,
    totalCount: linked.length,
    sourceCount: linked.filter(item => item.allocation_role === 'source' && item.to_account_ref === params.accountRef).length,
    sinkCount: linked.filter(item => item.allocation_role === 'sink').length,
    visibleCount: visible.length,
    visibleSourceTotal: visible
      .filter(item => item.allocation_role === 'source')
      .reduce((sum, item) => sum + item.monthly_amount, 0),
    visibleExternalSinkTotal: visible
      .filter(item => item.allocation_role === 'sink' && !allocationHasOwnedSinkDestination(item, accountRefs))
      .reduce((sum, item) => sum + item.monthly_amount, 0),
    visibleOwnedSinkTotal: visible
      .filter(item => allocationHasOwnedSinkDestination(item, accountRefs))
      .reduce((sum, item) => sum + item.monthly_amount, 0),
    miniNodes: visible.map(item => allocationMiniNodeLabel(item, params.accountRef, labelByRef, accountRefs)),
  }
}

/** Derive all account clusters keyed by account ref. */
export function deriveAllocationClusters(params: {
  accountNodes: CashFlowNodeSpec[]
  allocations: AllocationItem[]
  filtersByAccountRef: Record<string, AllocationClusterFilters>
}): Record<string, AccountAllocationCluster> {
  return Object.fromEntries(
    params.accountNodes.map(account => [
      account.ref,
      deriveAccountAllocationCluster({
        accountRef: account.ref,
        accountNodes: params.accountNodes,
        allocations: params.allocations,
        filters: params.filtersByAccountRef[account.ref] ?? DEFAULT_ALLOCATION_CLUSTER_FILTERS,
      }),
    ]),
  )
}

/** Compute the derived cluster box that account-node relayout and edge routing should avoid. */
export function allocationClusterBox(params: {
  accountRef: string
  accountX: number
  accountY: number
  accountWidth: number
  accountHeight: number
  miniNodeCount: number
  maxColumns?: number
}): RoutingBox {
  const columns = Math.max(1, Math.min(params.maxColumns ?? 3, Math.max(1, params.miniNodeCount)))
  const rows = Math.max(1, Math.ceil(Math.max(1, params.miniNodeCount) / columns))
  const width = columns * MINI_NODE_WIDTH + (columns - 1) * MINI_NODE_GAP
  const height = CLUSTER_HEADER_HEIGHT + rows * MINI_NODE_HEIGHT + (rows - 1) * MINI_NODE_GAP
  const x = params.accountX + params.accountWidth / 2 - width / 2
  const y = params.accountY + params.accountHeight + CLUSTER_TOP_GAP

  return {
    id: `${params.accountRef}_allocation_cluster`,
    x,
    y,
    width,
    height,
  }
}
