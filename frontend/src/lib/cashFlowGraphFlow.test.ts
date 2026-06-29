import { describe, expect, it } from 'vitest'

import {
  cashFlowEdgeToFlowEdge,
  defaultNewEdgeSpec,
  edgeSummaryLabel,
  flowElementsToGraphDocument,
  graphDocumentToFlowElements,
  newEdgeRef,
} from './cashFlowGraphFlow'
import type { CashFlowGraphDocument } from '../types'

describe('cashFlowGraphFlow', () => {
  it('round-trips a graph document through flow elements', () => {
    const doc: CashFlowGraphDocument = {
      plan_id: 7,
      nodes: [
        {
          ref: 'payroll',
          display_name: 'Payroll',
          kind: 'income_source',
          institution: null,
          layout_x: 10,
          layout_y: 20,
        },
        {
          ref: 'checking',
          display_name: 'Checking',
          kind: 'checking',
          institution: null,
          currency: 'USD',
          current_balance: '1234.56',
          balance_as_of: '2026-05-10',
          account_mask: '6789',
          notes: 'Primary checking',
          is_active: true,
          layout_x: 100,
          layout_y: 200,
        },
      ],
      edges: [
        {
          ref: 'deposit',
          from_ref: 'payroll',
          to_ref: 'checking',
          label: '',
          amount_rule: 'fixed',
          fixed_amount: '3000.00',
          percent_of_inflow: null,
          cadence: 'monthly',
          day_of_month: null,
        },
      ],
    }

    const { nodes, edges } = graphDocumentToFlowElements(doc)
    const back = flowElementsToGraphDocument(7, nodes, edges)

    expect(back.plan_id).toBe(7)
    expect(back.nodes).toHaveLength(2)
    expect(back.edges).toHaveLength(1)
    expect(back.nodes.find(n => n.ref === 'payroll')?.layout_x).toBe(10)
    expect(back.nodes.find(n => n.ref === 'checking')?.current_balance).toBe('1234.56')
    expect(back.nodes.find(n => n.ref === 'checking')?.balance_as_of).toBe('2026-05-10')
    expect(back.nodes.find(n => n.ref === 'checking')?.account_mask).toBe('6789')
    expect(back.nodes.find(n => n.ref === 'checking')?.notes).toBe('Primary checking')
    expect(back.nodes.find(n => n.ref === 'checking')?.is_active).toBe(true)
    expect(back.edges[0].fixed_amount).toBe('3000.00')
    expect(back.edges[0].amount_rule).toBe('fixed')
  })

  it('round-trips parent_ref on nodes', () => {
    const doc: CashFlowGraphDocument = {
      plan_id: 3,
      nodes: [
        {
          ref: 'umbrella',
          display_name: "Ian's Chase",
          kind: 'liability_surrogate',
          institution: 'Chase',
          parent_ref: null,
          layout_x: 0,
          layout_y: 0,
        },
        {
          ref: 'card',
          display_name: 'Sapphire',
          kind: 'liability_surrogate',
          institution: 'Chase',
          parent_ref: 'umbrella',
          layout_x: 1,
          layout_y: 1,
        },
      ],
      edges: [],
    }
    const { nodes, edges } = graphDocumentToFlowElements(doc)
    const back = flowElementsToGraphDocument(3, nodes, edges)
    expect(back.nodes.find(n => n.ref === 'card')?.parent_ref).toBe('umbrella')
    expect(back.nodes.find(n => n.ref === 'umbrella')?.parent_ref ?? null).toBeNull()
  })

  it('edgeSummaryLabel avoids echoing empty label', () => {
    expect(
      edgeSummaryLabel({
        ref: 'x',
        from_ref: 'a',
        to_ref: 'b',
        label: '',
        amount_rule: 'remainder',
        fixed_amount: null,
        percent_of_inflow: null,
        cadence: 'weekly',
        day_of_month: null,
      }),
    ).toBe('remainder')
  })

  it('maps edges with visible money-direction arrows', () => {
    const edge = cashFlowEdgeToFlowEdge({
      ref: 'pay_to_checking',
      from_ref: 'payroll',
      to_ref: 'checking',
      label: 'Deposit',
      amount_rule: 'fixed',
      fixed_amount: '5000.00',
      percent_of_inflow: null,
      cadence: 'monthly',
      day_of_month: null,
    })

    expect(edge.source).toBe('payroll')
    expect(edge.target).toBe('checking')
    expect(edge.animated).toBe(true)
    expect(edge.markerEnd).toMatchObject({ type: 'arrowclosed' })
    expect(edge.style).toMatchObject({ stroke: '#0f766e', strokeWidth: 2 })
  })

  it('defaultNewEdgeSpec is remainder monthly', () => {
    const s = defaultNewEdgeSpec('edgeAb', 'a', 'b')
    expect(s.amount_rule).toBe('remainder')
    expect(s.cadence).toBe('monthly')
    expect(s.day_of_month).toBeNull()
  })

  it('newEdgeRef matches API ref pattern prefix', () => {
    const r = newEdgeRef('pay', 'chk')
    expect(r.startsWith('e_')).toBe(true)
    expect(r.length).toBeLessThanOrEqual(64)
  })
})
