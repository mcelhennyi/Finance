import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ALLOCATION_CLUSTER_FILTERS,
  allocationClusterBox,
  allocationMiniNodeLabel,
  deriveAccountAllocationCluster,
} from './cashFlowAllocationClusters'
import { relayoutCashFlowNodes, type CashFlowRfNode } from './cashFlowGraphFlow'
import type { AllocationItem, CashFlowNodeSpec } from '../types'

const accountNodes: CashFlowNodeSpec[] = [
  { ref: 'payroll', display_name: 'Payroll', kind: 'income_source', institution: null, layout_x: 0, layout_y: 0 },
  { ref: 'checking', display_name: 'Main Checking', kind: 'checking', institution: null, layout_x: 200, layout_y: 0 },
  { ref: 'savings', display_name: 'High Yield Savings', kind: 'savings', institution: null, layout_x: 400, layout_y: 0 },
  { ref: 'card', display_name: 'Chase Card', kind: 'liability_surrogate', institution: null, layout_x: 200, layout_y: 160 },
]

const allocations: AllocationItem[] = [
  {
    id: 1,
    plan_id: 7,
    item_name: 'Paycheck deposit',
    category: 'Income',
    planned_amount: 5000,
    cadence: 'monthly',
    monthly_amount: 5000,
    allocation_role: 'source',
    from_account_ref: null,
    to_account_ref: 'checking',
    counterparty: 'Employer',
    payment_method: 'cash',
    due_day: 1,
    notes: '',
    sort_order: 0,
  },
  {
    id: 2,
    plan_id: 7,
    item_name: 'Savings sweep',
    category: 'Savings',
    planned_amount: 1000,
    cadence: 'monthly',
    monthly_amount: 1000,
    allocation_role: 'sink',
    from_account_ref: 'checking',
    to_account_ref: 'savings',
    counterparty: 'Ally',
    payment_method: 'cash',
    due_day: 3,
    notes: '',
    sort_order: 1,
  },
  {
    id: 3,
    plan_id: 7,
    item_name: 'Amazon order',
    category: 'Shopping',
    planned_amount: 120,
    cadence: 'weekly',
    monthly_amount: 519.6,
    allocation_role: 'sink',
    from_account_ref: 'card',
    to_account_ref: null,
    counterparty: 'Amazon',
    payment_method: 'credit',
    due_day: 18,
    notes: '',
    sort_order: 2,
  },
]

describe('cashFlowAllocationClusters', () => {
  it('derives account totals with source/sink splits and owned sink totals', () => {
    const cluster = deriveAccountAllocationCluster({
      accountRef: 'checking',
      accountNodes,
      allocations,
      filters: DEFAULT_ALLOCATION_CLUSTER_FILTERS,
    })

    expect(cluster.totalCount).toBe(2)
    expect(cluster.sourceCount).toBe(1)
    expect(cluster.sinkCount).toBe(1)
    expect(cluster.visibleCount).toBe(2)
    expect(cluster.visibleSourceTotal).toBe(5000)
    expect(cluster.visibleOwnedSinkTotal).toBe(1000)
    expect(cluster.visibleExternalSinkTotal).toBe(0)
  })

  it('filters visible counts by monthly size, cadence, role, payment, text, and due range', () => {
    const cluster = deriveAccountAllocationCluster({
      accountRef: 'card',
      accountNodes,
      allocations,
      filters: {
        ...DEFAULT_ALLOCATION_CLUSTER_FILTERS,
        monthlyMin: '500',
        monthlyMax: '600',
        cadence: 'weekly',
        allocationRole: 'sink',
        paymentMethod: 'credit',
        categorySearch: 'shop',
        counterpartySearch: 'ama',
        dueDayMin: '10',
        dueDayMax: '20',
      },
    })

    expect(cluster.totalCount).toBe(1)
    expect(cluster.visibleCount).toBe(1)
    expect(cluster.miniNodes[0].label).toBe('Amazon order')
  })

  it('labels source and sink mini-nodes with account context', () => {
    const labelByRef = new Map(accountNodes.map(node => [node.ref, node.display_name]))
    const accountRefs = new Set(accountNodes.map(node => node.ref))

    expect(allocationMiniNodeLabel(allocations[0], 'checking', labelByRef, accountRefs)).toMatchObject({
      label: 'Paycheck deposit',
      detail: 'external source -> Main Checking',
      roleLabel: 'Source',
      tone: 'source',
    })
    expect(allocationMiniNodeLabel(allocations[1], 'checking', labelByRef, accountRefs)).toMatchObject({
      label: 'Savings sweep',
      detail: 'Main Checking -> High Yield Savings storage',
      roleLabel: 'Sink',
      tone: 'owned_sink',
    })
  })

  it('returns an empty expansion for accounts with no linked allocations', () => {
    const cluster = deriveAccountAllocationCluster({
      accountRef: 'payroll',
      accountNodes,
      allocations,
      filters: DEFAULT_ALLOCATION_CLUSTER_FILTERS,
    })

    expect(cluster.totalCount).toBe(0)
    expect(cluster.visibleCount).toBe(0)
    expect(cluster.miniNodes).toEqual([])
  })

  it('uses the cluster box as a relayout obstacle after filter changes', () => {
    const accountA: CashFlowRfNode = {
      id: 'checking',
      type: 'cashNode',
      position: { x: 40, y: 40 },
      data: { spec: accountNodes[1] },
    }
    const accountB: CashFlowRfNode = {
      id: 'savings',
      type: 'cashNode',
      position: { x: 40, y: 150 },
      data: { spec: accountNodes[2] },
    }
    const box = allocationClusterBox({
      accountRef: 'checking',
      accountX: accountA.position.x,
      accountY: accountA.position.y,
      accountWidth: 192,
      accountHeight: 104,
      miniNodeCount: 1,
    })
    const relaid = relayoutCashFlowNodes([accountA, accountB], [box])

    expect(relaid.find(node => node.id === 'savings')?.position.y).toBeGreaterThan(box.y + box.height)
  })
})
