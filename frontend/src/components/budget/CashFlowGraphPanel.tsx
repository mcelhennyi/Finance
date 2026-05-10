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
import {
  CashEdgeData,
  CashFlowRfNode,
  defaultNewEdgeSpec,
  edgeSummaryLabel,
  flowElementsToGraphDocument,
  graphDocumentToFlowElements,
  newEdgeRef,
} from '../../lib/cashFlowGraphFlow'

const KIND_OPTIONS: CashNodeKind[] = [
  'income_source',
  'checking',
  'savings',
  'brokerage_cash',
  'external_pooled',
  'liability_surrogate',
  'other',
]

const REF_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/

function CashFlowNodeView({ data }: NodeProps<CashFlowRfNode>) {
  const spec = data.spec
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-[7.5rem] max-w-[14rem]">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-slate-300 !bg-teal-500" />
      <div className="text-xs font-semibold leading-snug text-slate-800 break-words">{spec.display_name}</div>
      <div className="mt-0.5 text-[10px] capitalize text-slate-500">{spec.kind.replace(/_/g, ' ')}</div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-slate-300 !bg-teal-500" />
    </div>
  )
}

const CashFlowNodeViewMemo = memo(CashFlowNodeView)

interface Props {
  planId: number | null
}

export function CashFlowGraphPanel({ planId }: Props) {
  const queryClient = useQueryClient()
  const [nodes, setNodes] = useNodesState<CashFlowRfNode>([])
  const [edges, setEdges] = useEdgesState<Edge<CashEdgeData>>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [addRef, setAddRef] = useState('')
  const [addName, setAddName] = useState('')
  const [addKind, setAddKind] = useState<CashNodeKind>('checking')
  const [addError, setAddError] = useState<string | null>(null)

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

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  )
  const selectedEdge = useMemo(
    () => edges.find(e => e.id === selectedEdgeId),
    [edges, selectedEdgeId],
  )

  const patchSelectedNode = useCallback(
    (partial: Partial<CashFlowNodeSpec>) => {
      if (!selectedNodeId) return
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== selectedNodeId) return n
          const nextSpec: CashFlowNodeSpec = { ...n.data.spec, ...partial }
          return { ...n, data: { spec: nextSpec } }
        }),
      )
    },
    [selectedNodeId, setNodes],
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
    const name = addName.trim() || ref
    const spec: CashFlowNodeSpec = {
      ref,
      display_name: name,
      kind: addKind,
      institution: null,
      layout_x: 40 + (nodes.length % 4) * 180,
      layout_y: 40 + Math.floor(nodes.length / 4) * 130,
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
    setAddError(null)
  }, [addKind, addName, addRef, nodes.length, nodes, setNodes])

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

          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Add node</div>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="ref (id)"
                  value={addRef}
                  onChange={e => setAddRef(e.target.value)}
                  aria-label="New node ref"
                />
                <input
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="Display name"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  aria-label="New node display name"
                />
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm capitalize"
                  value={addKind}
                  onChange={e => setAddKind(e.target.value as CashNodeKind)}
                  aria-label="New node kind"
                >
                  {KIND_OPTIONS.map(k => (
                    <option key={k} value={k}>
                      {k.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddNode}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                >
                  Add node
                </button>
              </div>
              {addError && <p className="text-xs text-red-700">{addError}</p>}
            </div>

            {selectedNode && (
              <div className="space-y-2 border-t border-slate-100 pt-3 md:border-t-0 md:border-l md:pl-4 md:pt-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Selected node</div>
                <label className="block text-xs text-slate-600">
                  Display name
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={selectedNode.data.spec.display_name}
                    onChange={e => patchSelectedNode({ display_name: e.target.value })}
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  Kind
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm capitalize"
                    value={selectedNode.data.spec.kind}
                    onChange={e => patchSelectedNode({ kind: e.target.value as CashNodeKind })}
                  >
                    {KIND_OPTIONS.map(k => (
                      <option key={k} value={k}>
                        {k.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {selectedEdge && selectedEdge.data?.spec && (
              <div className="space-y-2 border-t border-slate-100 pt-3 md:col-span-2">
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
            )}
          </div>
        </>
      )}
    </div>
  )
}
