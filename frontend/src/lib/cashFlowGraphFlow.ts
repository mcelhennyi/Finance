/**
 * Maps cash-flow graph API documents to @xyflow/react elements and back.
 *
 * See Also: tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md
 */

import { MarkerType, type Edge, type Node } from '@xyflow/react'

import type {
  CashFlowEdgeSpec,
  CashFlowGraphDocument,
  CashFlowNodeSpec,
  CashNodeKind,
} from '../types'

const GRID_X = 200
const GRID_Y = 120
const MONEY_FLOW_EDGE_COLOR = '#0f766e'

function stableOffset(ref: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < ref.length; i++) h = (h * 33 + ref.charCodeAt(i)) | 0
  const u = Math.abs(h)
  return { x: (u % 6) * GRID_X, y: ((u / 6) | 0) % 5 * GRID_Y }
}

/** Default canvas coordinates for a new graph node from its ref. */
export function defaultNodeLayoutForRef(ref: string): { layout_x: number; layout_y: number } {
  const o = stableOffset(ref)
  return { layout_x: o.x, layout_y: o.y }
}

export type CashNodeData = { spec: CashFlowNodeSpec; highlighted?: boolean }
export type CashEdgeData = { spec: CashFlowEdgeSpec }

/** Typed React Flow node for custom `cashNode` renderer. */
export type CashFlowRfNode = Node<CashNodeData, 'cashNode'>

/** Human-readable edge summary for the canvas label (no raw institution names). */
export function edgeSummaryLabel(e: CashFlowEdgeSpec): string {
  if (e.label.trim()) return e.label.trim()
  if (e.amount_rule === 'fixed' && e.fixed_amount) return `fixed ${e.fixed_amount}`
  if (e.amount_rule === 'percent_of_inflow' && e.percent_of_inflow != null) {
    return `${e.percent_of_inflow}%`
  }
  if (e.amount_rule === 'remainder') return 'remainder'
  return e.cadence
}

export function cashFlowEdgeToFlowEdge(e: CashFlowEdgeSpec): Edge<CashEdgeData> {
  return {
    id: e.ref,
    source: e.from_ref,
    target: e.to_ref,
    label: edgeSummaryLabel(e),
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: MONEY_FLOW_EDGE_COLOR,
      width: 18,
      height: 18,
    },
    style: {
      stroke: MONEY_FLOW_EDGE_COLOR,
      strokeWidth: 2,
    },
    data: { spec: { ...e } },
  }
}

export function graphDocumentToFlowElements(doc: CashFlowGraphDocument): {
  nodes: CashFlowRfNode[]
  edges: Edge<CashEdgeData>[]
} {
  const nodes: CashFlowRfNode[] = doc.nodes.map(n => {
    const fallback = stableOffset(n.ref)
    const x = n.layout_x ?? fallback.x
    const y = n.layout_y ?? fallback.y
    return {
      id: n.ref,
      type: 'cashNode',
      position: { x, y },
      data: { spec: { ...n } },
    }
  })

  const edges: Edge<CashEdgeData>[] = doc.edges.map(cashFlowEdgeToFlowEdge)

  return { nodes, edges }
}

export function newEdgeRef(fromRef: string, toRef: string): string {
  const tail = `${fromRef}_${toRef}_${Date.now().toString(36)}`
  return `e_${tail}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
}

/** Default edge used when the user connects two nodes in the UI (valid for the API). */
export function defaultNewEdgeSpec(ref: string, fromRef: string, toRef: string): CashFlowEdgeSpec {
  return {
    ref,
    from_ref: fromRef,
    to_ref: toRef,
    label: '',
    amount_rule: 'remainder',
    fixed_amount: null,
    percent_of_inflow: null,
    cadence: 'monthly',
    day_of_month: null,
  }
}

export function flowElementsToGraphDocument(
  planId: number,
  nodes: CashFlowRfNode[],
  edges: Edge<CashEdgeData>[],
): CashFlowGraphDocument {
  const nodeSpecs: CashFlowNodeSpec[] = nodes.map(n => {
    const prev = n.data?.spec
    const ref = n.id
    return {
      ref,
      display_name: prev?.display_name?.trim() ? prev.display_name.trim() : ref,
      kind: (prev?.kind ?? 'other') as CashNodeKind,
      institution: prev?.institution ?? null,
      parent_ref: prev?.parent_ref?.trim() ? prev.parent_ref.trim() : null,
      layout_x: n.position.x,
      layout_y: n.position.y,
      currency: prev?.currency ?? 'USD',
      current_balance: prev?.current_balance ?? null,
      balance_as_of: prev?.balance_as_of ?? null,
      account_mask: prev?.account_mask?.trim() ? prev.account_mask.trim() : null,
      notes: prev?.notes ?? '',
      is_active: prev?.is_active ?? true,
    }
  })

  const edgeSpecs: CashFlowEdgeSpec[] = edges.map(e => {
    const prev = e.data?.spec
    if (!e.source || !e.target) {
      throw new Error('Edge missing source or target')
    }
    return {
      ref: e.id,
      from_ref: e.source,
      to_ref: e.target,
      label: prev?.label ?? '',
      amount_rule: prev?.amount_rule ?? 'remainder',
      fixed_amount: prev?.fixed_amount ?? null,
      percent_of_inflow: prev?.percent_of_inflow ?? null,
      cadence: prev?.cadence ?? 'monthly',
      day_of_month: prev?.day_of_month ?? null,
    }
  })

  return { plan_id: planId, nodes: nodeSpecs, edges: edgeSpecs }
}
