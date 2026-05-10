import '@xyflow/react/dist/style.css'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useStore,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../api/client'
import type { CashFlowEdgeSpec, CashFlowNodeSpec, CashNodeKind } from '../../types'
import { suggestedEdgesFromBbdResponse } from '../../lib/bbdCashFlowSuggestions'
import {
  CashEdgeData,
  CashFlowRfNode,
  defaultNewEdgeSpec,
  edgeSummaryLabel,
  flowElementsToGraphDocument,
  graphDocumentToFlowElements,
  newEdgeRef,
} from '../../lib/cashFlowGraphFlow'
import {
  aggregateNodeFlows,
  type TimeGrain,
} from '../../lib/cashFlowTimeAggregation'
import { formatUsd } from '../../lib/budgetAllocation'
import { CASH_NODE_KIND_OPTIONS, CASH_FLOW_REF_PATTERN } from '../../lib/cashFlowGraphKinds'

const KIND_OPTIONS: CashNodeKind[] = CASH_NODE_KIND_OPTIONS

const REF_PATTERN = CASH_FLOW_REF_PATTERN

function descendantRefs(nodes: CashFlowRfNode[], rootId: string): Set<string> {
  const byParent = new Map<string, string[]>()
  for (const n of nodes) {
    const p = n.data.spec.parent_ref?.trim()
    if (!p) continue
    const list = byParent.get(p)
    if (list) list.push(n.id)
    else byParent.set(p, [n.id])
  }
  const out = new Set<string>()
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const x = stack.pop()!
    if (out.has(x)) continue
    out.add(x)
    const ch = byParent.get(x)
    if (ch) stack.push(...ch)
  }
  return out
}

function accountRows(nodes: CashFlowRfNode[]): { node: CashFlowRfNode; depth: number }[] {
  const byParent = new Map<string, CashFlowRfNode[]>()
  const byId = new Set(nodes.map(n => n.id))
  const roots: CashFlowRfNode[] = []
  for (const node of nodes) {
    const parentRef = node.data.spec.parent_ref?.trim()
    if (parentRef && byId.has(parentRef)) {
      const children = byParent.get(parentRef)
      if (children) children.push(node)
      else byParent.set(parentRef, [node])
    } else {
      roots.push(node)
    }
  }

  const byLabel = (a: CashFlowRfNode, b: CashFlowRfNode) =>
    a.data.spec.display_name.localeCompare(b.data.spec.display_name)
  const out: { node: CashFlowRfNode; depth: number }[] = []
  const visit = (node: CashFlowRfNode, depth: number) => {
    out.push({ node, depth })
    for (const child of [...(byParent.get(node.id) ?? [])].sort(byLabel)) visit(child, depth + 1)
  }
  for (const root of roots.sort(byLabel)) visit(root, 0)
  return out
}

function CashFlowNodeView({ data }: NodeProps<CashFlowRfNode>) {
  const spec = data.spec
  const parentLabel = useStore(s => {
    const pr = spec.parent_ref?.trim()
    if (!pr) return null
    const parent = s.nodeLookup.get(pr) as CashFlowRfNode | undefined
    return parent?.data?.spec?.display_name?.trim() || pr
  })
  const ring = data.highlighted
    ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-50 shadow-md z-10'
    : ''
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-[7.5rem] max-w-[14rem] ${ring}`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-slate-300 !bg-teal-500" />
      <div className="text-xs font-semibold leading-snug text-slate-800 break-words">{spec.display_name}</div>
      {parentLabel && (
        <div className="mt-0.5 text-[10px] text-slate-500 leading-snug break-words">Under {parentLabel}</div>
      )}
      <div className="mt-0.5 text-[10px] capitalize text-slate-500">{spec.kind.replace(/_/g, ' ')}</div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-slate-300 !bg-teal-500" />
    </div>
  )
}

const CashFlowNodeViewMemo = memo(CashFlowNodeView)

interface Props {
  planId: number | null
  /** Used for percent-of-inflow aggregation (plan summary monthly income). */
  planIncomeMonthly?: number | null
  /** Node refs to emphasize when hovering the allocation Account column. */
  highlightNodeRefs?: string[]
}

export function CashFlowGraphPanel({
  planId,
  planIncomeMonthly = null,
  highlightNodeRefs = [],
}: Props) {
  const queryClient = useQueryClient()
  const [nodes, setNodes] = useNodesState<CashFlowRfNode>([])
  const [edges, setEdges] = useEdgesState<Edge<CashEdgeData>>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [addRef, setAddRef] = useState('')
  const [addName, setAddName] = useState('')
  const [addKind, setAddKind] = useState<CashNodeKind>('checking')
  const [addInstitution, setAddInstitution] = useState('')
  const [addParentRef, setAddParentRef] = useState('')
  const [addCurrency, setAddCurrency] = useState('USD')
  const [addCurrentBalance, setAddCurrentBalance] = useState('')
  const [addBalanceAsOf, setAddBalanceAsOf] = useState('')
  const [addAccountMask, setAddAccountMask] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addIsActive, setAddIsActive] = useState(true)
  const [addError, setAddError] = useState<string | null>(null)
  const [grain, setGrain] = useState<TimeGrain>('month')
  const [bbdSuggestions, setBbdSuggestions] = useState<{
    edges: CashFlowEdgeSpec[]
    meta: { rationale: string }[]
  } | null>(null)

  const graphQuery = useQuery({
    queryKey: ['budgetCashFlowGraph', planId],
    queryFn: () => api.getBudgetCashFlowGraph(planId!),
    enabled: planId != null,
  })

  useEffect(() => {
    if (!graphQuery.data) return
    const el = graphDocumentToFlowElements(graphQuery.data)
    setNodes(el.nodes)
    setEdges(el.edges)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [graphQuery.data, setEdges, setNodes])

  const highlightKey = highlightNodeRefs.join('\0')
  useEffect(() => {
    const want = new Set(highlightNodeRefs)
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...n.data, highlighted: want.has(n.id) },
      })),
    )
  }, [highlightKey, highlightNodeRefs, setNodes])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (planId == null) throw new Error('No plan')
      const doc = flowElementsToGraphDocument(planId, nodes, edges)
      return api.putBudgetCashFlowGraph(planId, doc)
    },
    onSuccess: data => {
      if (planId != null) {
        queryClient.setQueryData(['budgetCashFlowGraph', planId], data)
      }
    },
  })

  const bbdSuggestMut = useMutation({
    mutationFn: async () => {
      const def = await api.bbdDefaultScenario()
      return api.bbdProjectionRun({
        scenario: def.scenario,
        monte_carlo_trials: 0,
      })
    },
    onSuccess: data => {
      if (planId == null) return
      try {
        const doc = flowElementsToGraphDocument(planId, nodes, edges)
        setBbdSuggestions(suggestedEdgesFromBbdResponse(data, doc.nodes))
      } catch {
        setBbdSuggestions(null)
      }
    },
  })

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const ref = newEdgeRef(connection.source, connection.target)
      const spec = defaultNewEdgeSpec(ref, connection.source, connection.target)
      setEdges(eds =>
        addEdge(
          {
            id: ref,
            source: connection.source,
            target: connection.target,
            label: edgeSummaryLabel(spec),
            data: { spec },
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<CashFlowRfNode>[]) => {
      setNodes(nds => applyNodeChanges(changes, nds))
    },
    [setNodes],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge<CashEdgeData>>[]) => {
      setEdges(eds => applyEdgeChanges(changes, eds))
    },
    [setEdges],
  )

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: CashFlowRfNode[]; edges: Edge<CashEdgeData>[] }) => {
      setSelectedNodeId(selNodes[0]?.id ?? null)
      setSelectedEdgeId(selEdges[0]?.id ?? null)
    },
    [],
  )

  const selectedEdge = useMemo(
    () => edges.find(e => e.id === selectedEdgeId),
    [edges, selectedEdgeId],
  )
  const accountListRows = useMemo(() => accountRows(nodes), [nodes])

  const graphDocForAgg = useMemo(() => {
    if (planId == null) return null
    try {
      return flowElementsToGraphDocument(planId, nodes, edges)
    } catch {
      return null
    }
  }, [planId, nodes, edges])

  const nodeTotals = useMemo(() => {
    if (!graphDocForAgg) return {}
    return aggregateNodeFlows(graphDocForAgg, grain, {
      planIncomeMonthly: planIncomeMonthly ?? null,
    })
  }, [graphDocForAgg, grain, planIncomeMonthly])

  const patchNode = useCallback(
    (nodeId: string, partial: Partial<CashFlowNodeSpec>) => {
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== nodeId) return n
          const nextSpec: CashFlowNodeSpec = { ...n.data.spec, ...partial }
          return { ...n, data: { spec: nextSpec } }
        }),
      )
    },
    [setNodes],
  )

  const patchSelectedEdge = useCallback(
    (partial: Partial<CashFlowEdgeSpec>) => {
      if (!selectedEdgeId) return
      setEdges(eds =>
        eds.map(e => {
          if (e.id !== selectedEdgeId) return e
          const nextSpec: CashFlowEdgeSpec = { ...e.data!.spec, ...partial }
          const label = edgeSummaryLabel(nextSpec)
          return { ...e, label, data: { spec: nextSpec } }
        }),
      )
    },
    [selectedEdgeId, setEdges],
  )

  const handleAddNode = useCallback(() => {
    const ref = addRef.trim()
    if (!REF_PATTERN.test(ref)) {
      setAddError('Ref must start with a letter; letters, digits, underscore, hyphen only (max 64).')
      return
    }
    if (nodes.some(n => n.id === ref)) {
      setAddError('That ref is already used.')
      return
    }
    const currency = addCurrency.trim().toUpperCase()
    if (currency.length !== 3) {
      setAddError('Currency must be a 3-letter code, e.g. USD.')
      return
    }
    if (addCurrentBalance.trim() && !addBalanceAsOf) {
      setAddError('Set a balance date when adding a current balance.')
      return
    }
    const name = addName.trim() || ref
    const spec: CashFlowNodeSpec = {
      ref,
      display_name: name,
      kind: addKind,
      institution: addInstitution.trim() || null,
      parent_ref: addParentRef || null,
      layout_x: 40 + (nodes.length % 4) * 180,
      layout_y: 40 + Math.floor(nodes.length / 4) * 130,
      currency,
      current_balance: addCurrentBalance.trim() || null,
      balance_as_of: addBalanceAsOf || null,
      account_mask: addAccountMask.trim() || null,
      notes: addNotes,
      is_active: addIsActive,
    }
    const next: CashFlowRfNode = {
      id: ref,
      type: 'cashNode',
      position: { x: spec.layout_x!, y: spec.layout_y! },
      data: { spec },
    }
    setNodes(nds => [...nds, next])
    setAddRef('')
    setAddName('')
    setAddInstitution('')
    setAddParentRef('')
    setAddCurrency('USD')
    setAddCurrentBalance('')
    setAddBalanceAsOf('')
    setAddAccountMask('')
    setAddNotes('')
    setAddIsActive(true)
    setAddError(null)
  }, [
    addAccountMask,
    addBalanceAsOf,
    addCurrency,
    addCurrentBalance,
    addInstitution,
    addIsActive,
    addKind,
    addName,
    addNotes,
    addParentRef,
    addRef,
    nodes.length,
    nodes,
    setNodes,
  ])

  const addSuggestedEdge = useCallback(
    (spec: CashFlowEdgeSpec) => {
      setEdges(eds => {
        if (eds.some(e => e.id === spec.ref)) return eds
        return [
          ...eds,
          {
            id: spec.ref,
            source: spec.from_ref,
            target: spec.to_ref,
            label: edgeSummaryLabel(spec),
            data: { spec },
          },
        ]
      })
    },
    [setEdges],
  )

  const nodeTypes = useMemo(
    (): NodeTypes => ({ cashNode: CashFlowNodeViewMemo }),
    [],
  )

  const loadErr = graphQuery.error instanceof Error ? graphQuery.error.message : null

  if (planId == null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
        Select or create an allocation plan to edit the cash flow map.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {graphQuery.isLoading && (
        <div className="h-48 rounded-xl bg-slate-100 animate-pulse" aria-hidden />
      )}

      {graphQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Could not load cash flow graph. {loadErr}
        </div>
      )}

      {!graphQuery.isLoading && !graphQuery.isError && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Save graph'}
            </button>
            <button
              type="button"
              onClick={() => graphQuery.refetch()}
              disabled={graphQuery.isFetching}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {graphQuery.isFetching ? 'Reloading…' : 'Reload'}
            </button>
            {saveMut.isError && (
              <span className="text-xs text-red-700" role="alert">
                {saveMut.error instanceof Error ? saveMut.error.message : 'Save failed'}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Time view (approximate)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-600 flex items-center gap-2">
                Grain
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={grain}
                  onChange={e => setGrain(e.target.value as TimeGrain)}
                  aria-label="Aggregation time grain"
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </label>
              <span className="text-[11px] text-slate-500">
                Fixed and percent-of-inflow edges; remainder flows count as $0 here.
              </span>
            </div>
            {graphDocForAgg && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1 pr-2">Node</th>
                      <th className="py-1 pr-2 tabular-nums">In</th>
                      <th className="py-1 pr-2 tabular-nums">Out</th>
                      <th className="py-1 tabular-nums">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphDocForAgg.nodes.map(n => {
                      const t = nodeTotals[n.ref]
                      return (
                        <tr key={n.ref} className="border-b border-slate-50">
                          <td className="py-1 pr-2 font-medium text-slate-800">{n.display_name}</td>
                          <td className="py-1 pr-2 tabular-nums">{formatUsd(t?.inflow ?? 0)}</td>
                          <td className="py-1 pr-2 tabular-nums">{formatUsd(t?.outflow ?? 0)}</td>
                          <td className="py-1 tabular-nums">{formatUsd(t?.net ?? 0)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-900/80">
              BBD-linked suggestions
            </div>
            <p className="text-[11px] text-amber-950/85 leading-snug">
              Runs the default projection once (deterministic path; Monte Carlo off). Proposed edges can be
              added below — nothing persists until <strong>Save graph</strong>.
            </p>
            <button
              type="button"
              disabled={bbdSuggestMut.isPending}
              onClick={() => {
                setBbdSuggestions(null)
                bbdSuggestMut.mutate()
              }}
              className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {bbdSuggestMut.isPending ? 'Running projection…' : 'Generate suggestions from BBD'}
            </button>
            {bbdSuggestMut.isError && (
              <p className="text-xs text-red-700" role="alert">
                {bbdSuggestMut.error instanceof Error ? bbdSuggestMut.error.message : 'Projection failed'}
              </p>
            )}
            {bbdSuggestions && bbdSuggestions.edges.length === 0 && !bbdSuggestMut.isPending && (
              <p className="text-xs text-slate-600">
                No suggestions — ensure checking / brokerage / income nodes exist, or dividends and draws are
                positive in the projection.
              </p>
            )}
            {bbdSuggestions && bbdSuggestions.edges.length > 0 && (
              <ul className="space-y-2">
                {bbdSuggestions.edges.map((spec, i) => (
                  <li
                    key={spec.ref}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-100 bg-white px-2 py-2 text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{spec.label}</div>
                      <div className="text-slate-500">{bbdSuggestions.meta[i]?.rationale}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSuggestedEdge(spec)}
                      className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-900"
                    >
                      Add edge
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{ height: 'min(55vh, 28rem)' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              deleteKeyCode={['Backspace', 'Delete']}
              proOptions={{ hideAttribution: true }}
              className="bg-slate-50"
            >
              <Background gap={16} />
              <Controls />
              <MiniMap
                className="!bg-white/90"
                maskColor="rgba(15, 23, 42, 0.12)"
                nodeStrokeWidth={2}
              />
            </ReactFlow>
          </div>

          <p className="text-xs text-slate-500">
            Drag nodes, connect handles to add flows, select an edge or node to edit details. Delete key removes the selection.
          </p>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Accounts</div>
              <p className="mt-1 text-xs text-slate-500">
                Add accounts, nest child accounts under parents, and edit account data. Changes persist when you
                save the graph.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                placeholder="ref (id)"
                value={addRef}
                onChange={e => setAddRef(e.target.value)}
                aria-label="New account ref"
              />
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                placeholder="Display name"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                aria-label="New account display name"
              />
              <select
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm capitalize"
                value={addKind}
                onChange={e => setAddKind(e.target.value as CashNodeKind)}
                aria-label="New account kind"
              >
                {KIND_OPTIONS.map(k => (
                  <option key={k} value={k}>
                    {k.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                placeholder="Institution"
                value={addInstitution}
                onChange={e => setAddInstitution(e.target.value)}
                aria-label="New account institution"
              />
              <select
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={addParentRef}
                onChange={e => setAddParentRef(e.target.value)}
                aria-label="New account parent"
              >
                <option value="">No parent</option>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.data.spec.display_name} ({n.id})
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm uppercase"
                placeholder="USD"
                value={addCurrency}
                onChange={e => setAddCurrency(e.target.value)}
                aria-label="New account currency"
                maxLength={3}
              />
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
                placeholder="Current balance"
                value={addCurrentBalance}
                onChange={e => setAddCurrentBalance(e.target.value)}
                aria-label="New account current balance"
              />
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={addBalanceAsOf}
                onChange={e => setAddBalanceAsOf(e.target.value)}
                aria-label="New account balance date"
              />
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                placeholder="Mask (last 4)"
                value={addAccountMask}
                onChange={e => setAddAccountMask(e.target.value)}
                aria-label="New account mask"
              />
              <input
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm md:col-span-2"
                placeholder="Notes"
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                aria-label="New account notes"
              />
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={addIsActive}
                  onChange={e => setAddIsActive(e.target.checked)}
                />
                Active
              </label>
              <button
                type="button"
                onClick={handleAddNode}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
              >
                Add account
              </button>
            </div>
            {addError && <p className="text-xs text-red-700">{addError}</p>}
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-[64rem] w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-3 py-2">Account</th>
                    <th className="px-3 py-2">Kind</th>
                    <th className="px-3 py-2">Institution</th>
                    <th className="px-3 py-2">Parent</th>
                    <th className="px-3 py-2">Balance</th>
                    <th className="px-3 py-2">Mask</th>
                    <th className="px-3 py-2">Notes</th>
                    <th className="px-3 py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {accountListRows.map(({ node, depth }) => {
                    const spec = node.data.spec
                    const blocked = descendantRefs(nodes, node.id)
                    blocked.add(node.id)
                    const rowParentOptions = nodes.filter(n => !blocked.has(n.id))
                    return (
                      <tr
                        key={node.id}
                        className={`border-b border-slate-50 last:border-0 align-top ${
                          node.id === selectedNodeId ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div style={{ paddingLeft: `${depth * 1.25}rem` }}>
                            <input
                              className="w-full rounded border border-slate-200 px-2 py-1 font-medium text-slate-800"
                              value={spec.display_name}
                              onChange={e => patchNode(node.id, { display_name: e.target.value })}
                              aria-label={`Display name for ${node.id}`}
                            />
                            <div className="mt-1 text-[10px] text-slate-400">{node.id}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded border border-slate-200 px-2 py-1 capitalize"
                            value={spec.kind}
                            onChange={e => patchNode(node.id, { kind: e.target.value as CashNodeKind })}
                          >
                            {KIND_OPTIONS.map(k => (
                              <option key={k} value={k}>
                                {k.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={spec.institution ?? ''}
                            onChange={e => patchNode(node.id, { institution: e.target.value || null })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={spec.parent_ref ?? ''}
                            onChange={e => patchNode(node.id, { parent_ref: e.target.value || null })}
                          >
                            <option value="">None</option>
                            {rowParentOptions.map(n => (
                              <option key={n.id} value={n.id}>
                                {n.data.spec.display_name} ({n.id})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="grid gap-1">
                            <div className="flex gap-1">
                              <input
                                className="w-16 rounded border border-slate-200 px-2 py-1 uppercase"
                                value={spec.currency ?? 'USD'}
                                onChange={e => patchNode(node.id, { currency: e.target.value.toUpperCase() })}
                                maxLength={3}
                                aria-label={`Currency for ${node.id}`}
                              />
                              <input
                                className="w-28 rounded border border-slate-200 px-2 py-1 tabular-nums"
                                value={spec.current_balance ?? ''}
                                onChange={e =>
                                  patchNode(node.id, { current_balance: e.target.value.trim() || null })
                                }
                                aria-label={`Current balance for ${node.id}`}
                              />
                            </div>
                            <input
                              type="date"
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={spec.balance_as_of ?? ''}
                              onChange={e => patchNode(node.id, { balance_as_of: e.target.value || null })}
                              aria-label={`Balance date for ${node.id}`}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={spec.account_mask ?? ''}
                            onChange={e => patchNode(node.id, { account_mask: e.target.value || null })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-slate-200 px-2 py-1"
                            value={spec.notes ?? ''}
                            onChange={e => patchNode(node.id, { notes: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={spec.is_active ?? true}
                            onChange={e => patchNode(node.id, { is_active: e.target.checked })}
                            aria-label={`Active status for ${node.id}`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedEdge && selectedEdge.data?.spec && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Selected edge</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-xs text-slate-600">
                    Label
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={selectedEdge.data.spec.label}
                      onChange={e => patchSelectedEdge({ label: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    Amount rule
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={selectedEdge.data.spec.amount_rule}
                      onChange={e => {
                        const rule = e.target.value as CashFlowEdgeSpec['amount_rule']
                        if (rule === 'remainder') {
                          patchSelectedEdge({
                            amount_rule: rule,
                            fixed_amount: null,
                            percent_of_inflow: null,
                          })
                        } else if (rule === 'fixed') {
                          patchSelectedEdge({
                            amount_rule: rule,
                            fixed_amount: selectedEdge.data!.spec.fixed_amount ?? '1.00',
                            percent_of_inflow: null,
                          })
                        } else {
                          patchSelectedEdge({
                            amount_rule: rule,
                            fixed_amount: null,
                            percent_of_inflow: selectedEdge.data!.spec.percent_of_inflow ?? '10',
                          })
                        }
                      }}
                    >
                      <option value="remainder">remainder</option>
                      <option value="fixed">fixed</option>
                      <option value="percent_of_inflow">percent_of_inflow</option>
                    </select>
                  </label>
                  {selectedEdge.data.spec.amount_rule === 'fixed' && (
                    <label className="block text-xs text-slate-600">
                      Fixed amount
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
                        value={selectedEdge.data.spec.fixed_amount ?? ''}
                        onChange={e => patchSelectedEdge({ fixed_amount: e.target.value || null })}
                      />
                    </label>
                  )}
                  {selectedEdge.data.spec.amount_rule === 'percent_of_inflow' && (
                    <label className="block text-xs text-slate-600">
                      Percent (0–100)
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
                        value={selectedEdge.data.spec.percent_of_inflow ?? ''}
                        onChange={e => patchSelectedEdge({ percent_of_inflow: e.target.value || null })}
                      />
                    </label>
                  )}
                  <label className="block text-xs text-slate-600">
                    Cadence
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={selectedEdge.data.spec.cadence}
                      onChange={e =>
                        patchSelectedEdge({
                          cadence: e.target.value as CashFlowEdgeSpec['cadence'],
                          day_of_month: e.target.value === 'on_date' ? selectedEdge.data!.spec.day_of_month ?? 1 : null,
                        })
                      }
                    >
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                      <option value="on_date">on_date</option>
                    </select>
                  </label>
                  {selectedEdge.data.spec.cadence === 'on_date' && (
                    <label className="block text-xs text-slate-600">
                      Day of month
                      <input
                        type="number"
                        min={1}
                        max={31}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        value={selectedEdge.data.spec.day_of_month ?? ''}
                        onChange={e => {
                          const v = e.target.value === '' ? null : Number(e.target.value)
                          patchSelectedEdge({
                            day_of_month: v != null && Number.isInteger(v) ? v : null,
                          })
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
