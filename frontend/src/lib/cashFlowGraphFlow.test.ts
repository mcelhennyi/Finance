import { describe, expect, it } from 'vitest'

import {
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
    expect(back.edges[0].fixed_amount).toBe('3000.00')
    expect(back.edges[0].amount_rule).toBe('fixed')
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
