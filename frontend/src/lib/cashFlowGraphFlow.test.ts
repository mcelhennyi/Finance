import { describe, expect, it } from 'vitest'

import {
  applyOrthogonalEdgeRoutes,
  cashFlowEdgeToFlowEdge,
  completeDirectionalAccountLink,
  defaultNewEdgeSpec,
  deriveAccountNodeRoles,
  edgeSummaryLabel,
  flowElementsToGraphDocument,
  graphDocumentToFlowElements,
  newEdgeRef,
  relayoutCashFlowNodes,
  startDirectionalAccountLink,
  validateDirectionalAccountLink,
} from './cashFlowGraphFlow'
import {
  orthogonalPathFromPoints,
  routingBoxesOverlap,
  routeOrthogonalEdges,
  type RoutingBox,
} from './cashFlowGraphRouting'
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

  it('derives account node roles from directed edge incidence', () => {
    const roles = deriveAccountNodeRoles(['payroll', 'checking', 'savings', 'brokerage'], [
      { source: 'payroll', target: 'checking' },
      { source: 'checking', target: 'savings' },
    ])

    expect(roles.payroll).toBe('source')
    expect(roles.savings).toBe('sink')
    expect(roles.checking).toBe('source_sink')
    expect(roles.brokerage).toBe('unlinked')
  })

  it('tracks pending source selection for directional account linking', () => {
    expect(startDirectionalAccountLink('checking')).toEqual({
      status: 'pending',
      pendingFromRef: 'checking',
      error: null,
    })
  })

  it('completes a pending directional account link', () => {
    expect(completeDirectionalAccountLink('checking', 'savings', [])).toEqual({
      status: 'ready',
      pendingFromRef: null,
      fromRef: 'checking',
      toRef: 'savings',
      error: null,
    })
  })

  it('rejects duplicate directional account links', () => {
    expect(
      completeDirectionalAccountLink('checking', 'savings', [
        { source: 'checking', target: 'savings' },
      ]),
    ).toEqual({
      status: 'error',
      pendingFromRef: 'checking',
      error: 'That account flow already exists.',
    })
  })

  it('rejects self-links for directional account links', () => {
    expect(completeDirectionalAccountLink('checking', 'checking', [])).toEqual({
      status: 'error',
      pendingFromRef: 'checking',
      error: 'Choose two different accounts.',
    })
  })

  it('supports the select/button fallback path through the same validation', () => {
    expect(validateDirectionalAccountLink('payroll', 'checking', [])).toEqual({
      status: 'ready',
      pendingFromRef: null,
      fromRef: 'payroll',
      toRef: 'checking',
      error: null,
    })
  })

  it('generates square orthogonal SVG paths from points', () => {
    expect(
      orthogonalPathFromPoints([
        { x: 10, y: 20 },
        { x: 10, y: 20 },
        { x: 80, y: 20 },
        { x: 80, y: 70 },
      ]),
    ).toBe('M 10 20 L 80 20 L 80 70')
  })

  it('assigns stable separate lanes for multiple outgoing edges from one node', () => {
    const routes = routeOrthogonalEdges(
      [
        { id: 'checking', position: { x: 0, y: 100 } },
        { id: 'savings', position: { x: 360, y: 20 } },
        { id: 'brokerage', position: { x: 360, y: 180 } },
      ],
      [
        { id: 'edge_z', source: 'checking', target: 'savings' },
        { id: 'edge_a', source: 'checking', target: 'brokerage' },
      ],
    )

    expect(routes.edge_a.laneIndex).toBe(0)
    expect(routes.edge_z.laneIndex).toBe(1)
    expect(routes.edge_a.points[1].y).not.toBe(routes.edge_z.points[1].y)
    expect(routes.edge_a.points[1].x).toBe(routes.edge_a.points[0].x)
    expect(routes.edge_z.points[1].x).toBe(routes.edge_z.points[0].x)
  })

  it('routes around an obstacle box between source and target', () => {
    const obstacle: RoutingBox = { id: 'expanded_checking', x: 240, y: 100, width: 160, height: 120 }
    const routes = routeOrthogonalEdges(
      [
        { id: 'payroll', position: { x: 0, y: 100 } },
        { id: 'savings', position: { x: 520, y: 100 } },
      ],
      [{ id: 'deposit', source: 'payroll', target: 'savings' }],
      { obstacles: [obstacle] },
    )
    const route = routes.deposit

    expect(route.points.every((point, index, points) => {
      const previous = points[index - 1]
      return !previous || previous.x === point.x || previous.y === point.y
    })).toBe(true)
    expect(route.points.some(point => point.y < obstacle.y || point.y > obstacle.y + obstacle.height)).toBe(true)
    expect(route.path).toContain(' L ')
  })

  it('places edge labels outside node and obstacle boxes', () => {
    const obstacle: RoutingBox = { id: 'expanded_checking', x: 230, y: 72, width: 180, height: 96 }
    const routes = routeOrthogonalEdges(
      [
        { id: 'payroll', position: { x: 0, y: 80 } },
        { id: 'savings', position: { x: 520, y: 80 } },
      ],
      [{ id: 'deposit', source: 'payroll', target: 'savings' }],
      { obstacles: [obstacle] },
    )

    expect(routingBoxesOverlap(routes.deposit.labelBox, obstacle)).toBe(false)
    expect(routes.deposit.labelPosition.y).not.toBe(132)
  })

  it('keeps labels clear of their own source and target nodes', () => {
    const nodeWidth = 192
    const nodeHeight = 104
    const routes = routeOrthogonalEdges(
      [
        { id: 'payroll', position: { x: 0, y: 80 } },
        { id: 'checking', position: { x: 340, y: 80 } },
      ],
      [{ id: 'deposit', source: 'payroll', target: 'checking' }],
      { nodeWidth, nodeHeight, labelWidth: 220, labelHeight: 32 },
    )
    const sourceBox: RoutingBox = { id: 'payroll', x: 0, y: 80, width: nodeWidth, height: nodeHeight }
    const targetBox: RoutingBox = { id: 'checking', x: 340, y: 80, width: nodeWidth, height: nodeHeight }

    expect(routingBoxesOverlap(routes.deposit.labelBox, sourceBox)).toBe(false)
    expect(routingBoxesOverlap(routes.deposit.labelBox, targetBox)).toBe(false)
  })

  it('deconflicts labels for edges that share the same corridor', () => {
    const routes = routeOrthogonalEdges(
      [
        { id: 'checking', position: { x: 0, y: 100 } },
        { id: 'savings', position: { x: 520, y: 100 } },
        { id: 'brokerage', position: { x: 0, y: 220 } },
        { id: 'reserve', position: { x: 520, y: 220 } },
      ],
      [
        { id: 'edge_a', source: 'checking', target: 'savings' },
        { id: 'edge_b', source: 'brokerage', target: 'reserve' },
      ],
      { labelWidth: 160, labelHeight: 32, laneStep: 16 },
    )

    expect(routingBoxesOverlap(routes.edge_a.labelBox, routes.edge_b.labelBox)).toBe(false)
  })

  it('reserves previous line lanes when routing later edges', () => {
    const routes = routeOrthogonalEdges(
      [
        { id: 'alpha_source', position: { x: 0, y: 0 } },
        { id: 'zeta_target', position: { x: 520, y: 140 } },
        { id: 'beta_source', position: { x: 0, y: 140 } },
        { id: 'omega_target', position: { x: 520, y: 0 } },
      ],
      [
        { id: 'edge_a', source: 'alpha_source', target: 'zeta_target' },
        { id: 'edge_b', source: 'beta_source', target: 'omega_target' },
      ],
      { laneStep: 16, lineGap: 12 },
    )

    expect(routes.edge_a.points.some(point => point.x === routes.edge_b.points[2].x)).toBe(false)
  })

  it('attaches orthogonal route data to React Flow edges', () => {
    const source = {
      ref: 'checking',
      display_name: 'Checking',
      kind: 'checking' as const,
      institution: null,
      layout_x: 0,
      layout_y: 0,
    }
    const target = {
      ref: 'savings',
      display_name: 'Savings',
      kind: 'savings' as const,
      institution: null,
      layout_x: 360,
      layout_y: 0,
    }
    const doc: CashFlowGraphDocument = {
      plan_id: 1,
      nodes: [source, target],
      edges: [defaultNewEdgeSpec('checking_to_savings', 'checking', 'savings')],
    }
    const { nodes, edges } = graphDocumentToFlowElements(doc)
    const routed = applyOrthogonalEdgeRoutes(nodes, edges)

    expect(routed[0].type).toBe('orthogonalCashEdge')
    expect(routed[0].data?.route?.path.startsWith('M ')).toBe(true)
    expect(routed[0].data?.route?.labelPosition).toEqual(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }))
  })

  it('relayouts after cluster height changes while preserving unaffected account x positions', () => {
    const doc: CashFlowGraphDocument = {
      plan_id: 2,
      nodes: [
        {
          ref: 'checking',
          display_name: 'Checking',
          kind: 'checking',
          institution: null,
          layout_x: 40,
          layout_y: 40,
        },
        {
          ref: 'savings',
          display_name: 'Savings',
          kind: 'savings',
          institution: null,
          layout_x: 40,
          layout_y: 150,
        },
      ],
      edges: [],
    }
    const { nodes } = graphDocumentToFlowElements(doc)
    const cluster: RoutingBox = { id: 'checking_cluster', x: 40, y: 140, width: 240, height: 180 }
    const relaid = relayoutCashFlowNodes(nodes, [cluster])
    const savings = relaid.find(node => node.id === 'savings')

    expect(savings?.position.x).toBe(40)
    expect(savings?.position.y).toBeGreaterThan(cluster.y + cluster.height)
  })
})
