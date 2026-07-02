import '@xyflow/react/dist/style.css'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
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
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../api/client'
import type { AllocationItem, CashFlowEdgeSpec, CashFlowNodeSpec, CashNodeKind } from '../../types'
import { suggestedEdgesFromBbdResponse } from '../../lib/bbdCashFlowSuggestions'
import {
  DEFAULT_ALLOCATION_CLUSTER_FILTERS,
  allocationClusterBox,
  deriveAllocationClusters,
  type AccountAllocationCluster,
  type AllocationClusterFilters,
  type AllocationMiniNode,
} from '../../lib/cashFlowAllocationClusters'
import {
  applyOrthogonalEdgeRoutes,
  CashEdgeData,
  CashFlowRfNode,
  completeDirectionalAccountLink,
  cashFlowEdgeToFlowEdge,
  defaultNewEdgeSpec,
  deriveAccountNodeRoles,
  edgeSummaryLabel,
  flowElementsToGraphDocument,
  graphDocumentToFlowElements,
  newEdgeRef,
  relayoutCashFlowNodes,
  stackPureSourceSinkNodes,
  startDirectionalAccountLink,
  validateDirectionalAccountLink,
  type AccountNodeRole,
} from '../../lib/cashFlowGraphFlow'
import { ALLOCATION_ITEM_CADENCE_OPTIONS, ALLOCATION_ROLES, PAYMENT_METHODS, allocationCadenceLabel, formatUsd } from '../../lib/budgetAllocation'
import { CASH_NODE_KIND_OPTIONS, CASH_FLOW_REF_PATTERN, cashNodeKindLabel, cashNodeKindShortLabel } from '../../lib/cashFlowGraphKinds'
import { BUDGET_SCROLL_ANCHORS } from './budgetDocAnchors'

const KIND_OPTIONS: CashNodeKind[] = CASH_NODE_KIND_OPTIONS

const REF_PATTERN = CASH_FLOW_REF_PATTERN
const ACCOUNT_NODE_WIDTH = 192
const ACCOUNT_NODE_HEIGHT = 104
const MINI_NODE_WIDTH = 164
const MINI_NODE_HEIGHT = 74
const MINI_NODE_GAP = 12
const CLUSTER_HEADER_HEIGHT = 56

type AllocationMiniNodeData = {
  miniNode: AllocationMiniNode | null
  accountLabel: string
}

type AllocationMiniRfNode = Node<AllocationMiniNodeData, 'allocationMiniNode'>
type GraphDisplayNode = CashFlowRfNode | AllocationMiniRfNode

function formatNodeBalance(amount: string | null | undefined): string {
  const t = amount?.trim()
  if (!t) return '—'
  const n = Number(t)
  return Number.isFinite(n) ? formatUsd(n) : t
}

function formatBalanceDateLabel(iso: string | null | undefined): string {
  const t = iso?.trim()
  if (!t) return '—'
  const d = new Date(t.includes('T') ? t : `${t}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? t
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

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
  const isPendingSource = data.pendingLinkFrom
  const hasLinkError = data.linkError
  const role = data.role ?? 'unlinked'
  const roleClasses: Record<AccountNodeRole, string> = {
    source: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    sink: 'bg-sky-50 text-sky-800 ring-sky-100',
    source_sink: 'bg-violet-50 text-violet-800 ring-violet-100',
    unlinked: 'bg-slate-100 text-slate-500 ring-slate-200',
  }
  const roleLabel: Record<AccountNodeRole, string> = {
    source: 'Source',
    sink: 'Sink',
    source_sink: 'Source + sink',
    unlinked: 'Unlinked',
  }
  const allocationCluster = data.allocationCluster
  const sourceCount = allocationCluster?.sourceCount ?? 0
  const sinkCount = allocationCluster?.sinkCount ?? 0
  const totalCount = allocationCluster?.totalCount ?? 0
  const visibleCount = allocationCluster?.visibleCount ?? totalCount
  return (
    <div
      className={`relative rounded-lg border bg-white px-3 py-2 shadow-sm min-w-[7.5rem] max-w-[14rem] ${
        isPendingSource
          ? 'border-teal-500'
          : hasLinkError
            ? 'border-red-300'
            : 'border-slate-200'
      } ${ring}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        onDoubleClick={event => {
          event.stopPropagation()
          data.onFinishInputLink?.(spec.ref)
        }}
        title="Input: double-click to finish a directed account link"
        className="!left-[-9px] !h-8 !w-3 !rounded-full !border-slate-300 !bg-sky-500"
      />
      <div className="text-xs font-semibold leading-snug text-slate-800 break-words">{spec.display_name}</div>
      {parentLabel && (
        <div className="mt-0.5 text-[10px] text-slate-500 leading-snug break-words">Under {parentLabel}</div>
      )}
      <div className="mt-0.5 text-[10px] capitalize text-slate-500">{spec.kind.replace(/_/g, ' ')}</div>
      <div
        className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${roleClasses[role]}`}
      >
        {roleLabel[role]}
      </div>
      <button
        type="button"
        onClick={event => {
          event.stopPropagation()
          data.onToggleAllocationCluster?.(spec.ref)
        }}
        className={`mt-1 flex w-full items-center justify-between gap-1 rounded-md border px-1.5 py-1 text-[10px] font-semibold ${
          data.allocationExpanded
            ? 'border-teal-200 bg-teal-50 text-teal-900'
            : 'border-slate-100 bg-slate-50 text-slate-700'
        }`}
        aria-expanded={Boolean(data.allocationExpanded)}
        title="Show linked allocation rows below this account"
      >
        <span>{totalCount} allocations</span>
        <span className="tabular-nums text-[9px] text-slate-500">
          {sourceCount} in / {sinkCount} out
        </span>
      </button>
      {data.allocationExpanded && (
        <div className="mt-1 text-[9px] font-medium text-teal-800">
          {visibleCount} visible after filters
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        onDoubleClick={event => {
          event.stopPropagation()
          data.onStartOutputLink?.(spec.ref)
        }}
        title="Output: double-click to start a directed account link"
        className="!right-[-9px] !h-8 !w-3 !rounded-full !border-slate-300 !bg-teal-500"
      />
    </div>
  )
}

const CashFlowNodeViewMemo = memo(CashFlowNodeView)

function OrthogonalCashEdge({
  data,
  id,
  label,
  markerEnd,
  sourceX,
  sourceY,
  style,
  targetX,
  targetY,
}: EdgeProps<Edge<CashEdgeData>>) {
  const routePoints = data?.route?.points ?? [
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
  ]
  const path = data?.route?.path ?? `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  const fallbackLabelPosition = routePoints[Math.floor(routePoints.length / 2)] ?? {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2,
  }
  const labelPosition = data?.route?.labelPosition ?? fallbackLabelPosition

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute w-[8.25rem] truncate rounded-md border border-teal-100 bg-white/95 px-1.5 py-0.5 text-center text-[10px] font-medium text-teal-900 shadow-sm"
            data-cash-edge-label={id}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
            }}
            title={String(label)}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

const OrthogonalCashEdgeMemo = memo(OrthogonalCashEdge)

function AllocationMiniNodeView({ data }: NodeProps<AllocationMiniRfNode>) {
  if (!data.miniNode) {
    return (
      <div className="flex h-[4.625rem] w-[10.25rem] items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-3 text-center text-[10px] font-medium leading-snug text-slate-500 shadow-sm">
        No linked allocations for {data.accountLabel}.
      </div>
    )
  }

  const mini = data.miniNode
  const toneClass = {
    source: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    sink: 'border-rose-200 bg-rose-50 text-rose-950',
    owned_sink: 'border-sky-200 bg-sky-50 text-sky-950',
  }[mini.tone]

  return (
    <div className={`h-[4.625rem] w-[10.25rem] rounded-md border px-2 py-1.5 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide">
          {mini.roleLabel}
        </span>
        <span className="text-[10px] font-semibold tabular-nums">{formatUsd(mini.item.monthly_amount)}</span>
      </div>
      <div className="mt-1 truncate text-[11px] font-semibold" title={mini.label}>
        {mini.label}
      </div>
      <div className="mt-0.5 max-h-6 overflow-hidden text-[9px] leading-snug text-slate-600" title={mini.detail}>
        {mini.detail}
      </div>
    </div>
  )
}

const AllocationMiniNodeViewMemo = memo(AllocationMiniNodeView)

interface Props {
  planId: number | null
  allocationItems?: AllocationItem[]
  /** Node refs to emphasize when hovering the allocation Account column. */
  highlightNodeRefs?: string[]
  /** Controlled disclosure for the add-account form at the bottom of the accounts list. */
  addAccountPanelOpen: boolean
  onAddAccountPanelOpenChange: (open: boolean) => void
}

export function CashFlowGraphPanel({
  planId,
  allocationItems = [],
  highlightNodeRefs = [],
  addAccountPanelOpen,
  onAddAccountPanelOpenChange,
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
  const [linkFromRef, setLinkFromRef] = useState('')
  const [linkToRef, setLinkToRef] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [pendingLinkFromRef, setPendingLinkFromRef] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [expandedAccountRef, setExpandedAccountRef] = useState<string | null>(null)
  const [allocationFiltersByAccountRef, setAllocationFiltersByAccountRef] = useState<Record<string, AllocationClusterFilters>>({})
  const [bbdSuggestions, setBbdSuggestions] = useState<{
    edges: CashFlowEdgeSpec[]
    meta: { rationale: string }[]
  } | null>(null)
  /** When set, that account row shows inputs; all other rows are read-only. */
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)

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
    setEditingAccountId(null)
    setLinkFromRef(el.nodes[0]?.id ?? '')
    setLinkToRef(el.nodes.find(n => n.id !== el.nodes[0]?.id)?.id ?? '')
    setLinkLabel('')
    setPendingLinkFromRef(null)
    setLinkError(null)
    setExpandedAccountRef(null)
  }, [graphQuery.data, setEdges, setNodes])

  useEffect(() => {
    setEditingAccountId(null)
    setAllocationFiltersByAccountRef({})
    setExpandedAccountRef(null)
  }, [planId])

  const closeAccountEditModal = useCallback(() => {
    setEditingAccountId(null)
  }, [])

  useEffect(() => {
    if (editingAccountId == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAccountEditModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeAccountEditModal, editingAccountId])

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

  const linkMut = useMutation({
    mutationFn: async ({
      fromRef,
      toRef,
      label,
    }: {
      fromRef: string
      toRef: string
      label: string
    }) => {
      if (planId == null) throw new Error('No plan')
      const state = validateDirectionalAccountLink(fromRef, toRef, edges)
      if (state.status !== 'ready') throw new Error(state.error ?? 'Could not link accounts')

      const doc = flowElementsToGraphDocument(planId, nodes, edges)
      await api.putBudgetCashFlowGraph(planId, doc)
      return api.linkBudgetCashFlowAccounts(planId, {
        from_ref: state.fromRef,
        to_ref: state.toRef,
        label: label.trim(),
        amount_rule: 'remainder',
        fixed_amount: null,
        percent_of_inflow: null,
        cadence: 'monthly',
        day_of_month: null,
      })
    },
    onMutate: () => {
      setLinkError(null)
    },
    onSuccess: data => {
      if (planId != null) {
        queryClient.setQueryData(['budgetCashFlowGraph', planId], data)
      }
      setPendingLinkFromRef(null)
      setLinkLabel('')
    },
    onError: error => {
      setLinkError(error instanceof Error ? error.message : 'Could not link accounts')
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
      setEdges(eds => addEdge(cashFlowEdgeToFlowEdge(spec), eds))
    },
    [setEdges],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<GraphDisplayNode>[]) => {
      setNodes(nds => applyNodeChanges(changes as NodeChange<CashFlowRfNode>[], nds))
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
    ({ nodes: selNodes, edges: selEdges }: { nodes: GraphDisplayNode[]; edges: Edge<CashEdgeData>[] }) => {
      const selectedAccount = selNodes.find(node => node.type === 'cashNode')
      setSelectedNodeId(selectedAccount?.id ?? null)
      setSelectedEdgeId(selEdges[0]?.id ?? null)
    },
    [],
  )

  const submitDirectionalLink = useCallback(
    (fromRef: string, toRef: string, label: string) => {
      const state = validateDirectionalAccountLink(fromRef, toRef, edges)
      if (state.status !== 'ready') {
        setPendingLinkFromRef(state.pendingFromRef)
        setLinkError(state.error)
        return
      }
      setLinkError(null)
      setLinkFromRef(state.fromRef)
      setLinkToRef(state.toRef)
      linkMut.mutate({ fromRef: state.fromRef, toRef: state.toRef, label })
    },
    [edges, linkMut],
  )

  const handleOutputDoubleClick = useCallback((fromRef: string) => {
    const state = startDirectionalAccountLink(fromRef)
    setPendingLinkFromRef(state.pendingFromRef)
    setLinkFromRef(fromRef)
    setLinkError(null)
  }, [])

  const handleInputDoubleClick = useCallback(
    (toRef: string) => {
      const state = completeDirectionalAccountLink(pendingLinkFromRef, toRef, edges)
      setLinkToRef(toRef)
      if (state.status !== 'ready') {
        setPendingLinkFromRef(state.pendingFromRef)
        setLinkError(state.error)
        return
      }
      submitDirectionalLink(state.fromRef, state.toRef, linkLabel)
    },
    [edges, linkLabel, pendingLinkFromRef, submitDirectionalLink],
  )

  const selectedEdge = useMemo(
    () => edges.find(e => e.id === selectedEdgeId),
    [edges, selectedEdgeId],
  )
  const accountSpecs = useMemo(() => nodes.map(n => n.data.spec), [nodes])
  const allocationClusters = useMemo(
    () =>
      deriveAllocationClusters({
        accountNodes: accountSpecs,
        allocations: allocationItems,
        filtersByAccountRef: allocationFiltersByAccountRef,
      }),
    [accountSpecs, allocationFiltersByAccountRef, allocationItems],
  )
  const toggleAllocationCluster = useCallback((ref: string) => {
    setExpandedAccountRef(cur => (cur === ref ? null : ref))
    setAllocationFiltersByAccountRef(cur => ({
      ...cur,
      [ref]: cur[ref] ?? DEFAULT_ALLOCATION_CLUSTER_FILTERS,
    }))
  }, [])
  const activeAllocationFilters = expandedAccountRef
    ? allocationFiltersByAccountRef[expandedAccountRef] ?? DEFAULT_ALLOCATION_CLUSTER_FILTERS
    : DEFAULT_ALLOCATION_CLUSTER_FILTERS
  const activeAllocationCluster: AccountAllocationCluster | null = expandedAccountRef
    ? allocationClusters[expandedAccountRef] ?? null
    : null
  const activeAccountLabel = expandedAccountRef
    ? nodes.find(node => node.id === expandedAccountRef)?.data.spec.display_name ?? expandedAccountRef
    : ''
  const setActiveAllocationFilter = useCallback(
    <K extends keyof AllocationClusterFilters>(key: K, value: AllocationClusterFilters[K]) => {
      if (!expandedAccountRef) return
      setAllocationFiltersByAccountRef(cur => ({
        ...cur,
        [expandedAccountRef]: {
          ...(cur[expandedAccountRef] ?? DEFAULT_ALLOCATION_CLUSTER_FILTERS),
          [key]: value,
        },
      }))
    },
    [expandedAccountRef],
  )
  const roleByNodeRef = useMemo(
    () => deriveAccountNodeRoles(nodes.map(n => n.id), edges),
    [edges, nodes],
  )
  const roleStackedNodes = useMemo(
    () => stackPureSourceSinkNodes(nodes, edges),
    [edges, nodes],
  )
  const roughExpandedNode = useMemo(
    () => (expandedAccountRef ? roleStackedNodes.find(n => n.id === expandedAccountRef) : null),
    [expandedAccountRef, roleStackedNodes],
  )
  const roughCluster = expandedAccountRef && roughExpandedNode
    ? allocationClusterBox({
        accountRef: expandedAccountRef,
        accountX: roughExpandedNode.position.x,
        accountY: roughExpandedNode.position.y,
        accountWidth: ACCOUNT_NODE_WIDTH,
        accountHeight: ACCOUNT_NODE_HEIGHT,
        miniNodeCount: Math.max(1, allocationClusters[expandedAccountRef]?.visibleCount ?? 0),
      })
    : null
  const relaidNodes = useMemo(
    () => relayoutCashFlowNodes(roleStackedNodes, roughCluster ? [roughCluster] : []),
    [roleStackedNodes, roughCluster],
  )
  const finalExpandedNode = useMemo(
    () => (expandedAccountRef ? relaidNodes.find(n => n.id === expandedAccountRef) : null),
    [expandedAccountRef, relaidNodes],
  )
  const finalCluster = expandedAccountRef && finalExpandedNode
    ? allocationClusterBox({
        accountRef: expandedAccountRef,
        accountX: finalExpandedNode.position.x,
        accountY: finalExpandedNode.position.y,
        accountWidth: ACCOUNT_NODE_WIDTH,
        accountHeight: ACCOUNT_NODE_HEIGHT,
        miniNodeCount: Math.max(1, allocationClusters[expandedAccountRef]?.visibleCount ?? 0),
      })
    : null
  const displayedAccountNodes = useMemo(
    () =>
      relaidNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          role: roleByNodeRef[n.id] ?? 'unlinked',
          allocationCluster: allocationClusters[n.id],
          allocationExpanded: expandedAccountRef === n.id,
          pendingLinkFrom: pendingLinkFromRef === n.id,
          linkError: linkError != null && (pendingLinkFromRef === n.id || linkToRef === n.id),
          onToggleAllocationCluster: toggleAllocationCluster,
          onStartOutputLink: handleOutputDoubleClick,
          onFinishInputLink: handleInputDoubleClick,
        },
      })),
    [
      allocationClusters,
      expandedAccountRef,
      handleInputDoubleClick,
      handleOutputDoubleClick,
      linkError,
      linkToRef,
      pendingLinkFromRef,
      relaidNodes,
      roleByNodeRef,
      toggleAllocationCluster,
    ],
  )
  const allocationMiniNodes = useMemo((): AllocationMiniRfNode[] => {
    if (!expandedAccountRef || !finalCluster || !finalExpandedNode) return []
    const cluster = allocationClusters[expandedAccountRef]
    const accountLabel = finalExpandedNode.data.spec.display_name || expandedAccountRef
    const miniNodes = cluster?.miniNodes ?? []
    const columns = Math.max(1, Math.min(3, Math.max(1, miniNodes.length)))
    const startX = finalCluster.x
    const startY = finalCluster.y + CLUSTER_HEADER_HEIGHT
    const source: { id: string; miniNode: AllocationMiniNode | null }[] = miniNodes.length
      ? miniNodes.map(miniNode => ({ id: miniNode.id, miniNode }))
      : [{ id: `allocation-empty-${expandedAccountRef}`, miniNode: null }]

    return source.map((entry, index) => {
      return {
        id: entry.id,
        type: 'allocationMiniNode',
        position: {
          x: startX + (index % columns) * (MINI_NODE_WIDTH + MINI_NODE_GAP),
          y: startY + Math.floor(index / columns) * (MINI_NODE_HEIGHT + MINI_NODE_GAP),
        },
        draggable: false,
        selectable: false,
        data: { miniNode: entry.miniNode, accountLabel },
      }
    })
  }, [allocationClusters, expandedAccountRef, finalCluster, finalExpandedNode])
  const displayedNodes = useMemo<GraphDisplayNode[]>(
    () => [...displayedAccountNodes, ...allocationMiniNodes],
    [allocationMiniNodes, displayedAccountNodes],
  )
  const displayedEdges = useMemo(
    () => applyOrthogonalEdgeRoutes(displayedAccountNodes, edges, finalCluster ? [finalCluster] : []),
    [displayedAccountNodes, edges, finalCluster],
  )
  const accountListRows = useMemo(() => accountRows(nodes), [nodes])
  const editingAccountNode = useMemo(
    () => nodes.find(n => n.id === editingAccountId) ?? null,
    [editingAccountId, nodes],
  )
  const editingAccountParentOptions = useMemo(() => {
    if (!editingAccountNode) return []
    const blocked = descendantRefs(nodes, editingAccountNode.id)
    blocked.add(editingAccountNode.id)
    return nodes.filter(n => !blocked.has(n.id))
  }, [editingAccountNode, nodes])
  const nodeLabelByRef = useMemo(
    () => new Map(nodes.map(n => [n.id, n.data.spec.display_name || n.id])),
    [nodes],
  )
  const canLinkAccounts = nodes.length >= 2

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
    if (!linkFromRef) setLinkFromRef(ref)
    else if (!linkToRef && linkFromRef !== ref) setLinkToRef(ref)
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
    linkFromRef,
    linkToRef,
  ])

  const addSuggestedEdge = useCallback(
    (spec: CashFlowEdgeSpec) => {
      setEdges(eds => {
        if (eds.some(e => e.id === spec.ref)) return eds
        return [...eds, cashFlowEdgeToFlowEdge(spec)]
      })
    },
    [setEdges],
  )

  const nodeTypes = useMemo(
    (): NodeTypes => ({
      cashNode: CashFlowNodeViewMemo,
      allocationMiniNode: AllocationMiniNodeViewMemo,
    }),
    [],
  )
  const edgeTypes = useMemo(
    (): EdgeTypes => ({ orthogonalCashEdge: OrthogonalCashEdgeMemo }),
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

          {expandedAccountRef && activeAllocationCluster && (
            <div className="rounded-xl border border-teal-100 bg-white p-3 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-teal-700">
                    Expanded allocations
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{activeAccountLabel}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    {activeAllocationCluster.visibleCount}/{activeAllocationCluster.totalCount} visible
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                    Source {formatUsd(activeAllocationCluster.visibleSourceTotal)}
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-800">
                    External sink {formatUsd(activeAllocationCluster.visibleExternalSinkTotal)}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-800">
                    Owned destination {formatUsd(activeAllocationCluster.visibleOwnedSinkTotal)}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <label className="text-[11px] font-medium text-slate-600">
                  Min monthly
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.monthlyMin}
                    onChange={e => setActiveAllocationFilter('monthlyMin', e.target.value)}
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Max monthly
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.monthlyMax}
                    onChange={e => setActiveAllocationFilter('monthlyMax', e.target.value)}
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Cadence
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.cadence}
                    onChange={e => setActiveAllocationFilter('cadence', e.target.value)}
                  >
                    <option value="">Any</option>
                    {ALLOCATION_ITEM_CADENCE_OPTIONS.map(cadence => (
                      <option key={cadence} value={cadence}>
                        {allocationCadenceLabel(cadence)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Role
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.allocationRole}
                    onChange={e => setActiveAllocationFilter('allocationRole', e.target.value)}
                  >
                    <option value="">Any</option>
                    {ALLOCATION_ROLES.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Method
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.paymentMethod}
                    onChange={e => setActiveAllocationFilter('paymentMethod', e.target.value)}
                  >
                    <option value="">Any</option>
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Category
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.categorySearch}
                    onChange={e => setActiveAllocationFilter('categorySearch', e.target.value)}
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Counterparty
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.counterpartySearch}
                    onChange={e => setActiveAllocationFilter('counterpartySearch', e.target.value)}
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Due min
                  <input
                    type="text"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.dueDayMin}
                    onChange={e => setActiveAllocationFilter('dueDayMin', e.target.value)}
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  Due max
                  <input
                    type="text"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={activeAllocationFilters.dueDayMax}
                    onChange={e => setActiveAllocationFilter('dueDayMax', e.target.value)}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setAllocationFiltersByAccountRef(cur => ({
                        ...cur,
                        [expandedAccountRef]: DEFAULT_ALLOCATION_CLUSTER_FILTERS,
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{ height: 'min(55vh, 28rem)' }}>
            <ReactFlow<GraphDisplayNode, Edge<CashEdgeData>>
              nodes={displayedNodes}
              edges={displayedEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              connectionLineStyle={{ stroke: '#0f766e', strokeWidth: 2 }}
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
            Drag nodes, double-click a right output then a left input to link accounts, or use the account-link controls below. Delete key removes the selection.
          </p>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Accounts</div>
              <p className="mt-1 text-xs text-slate-500">
                Browse accounts in the table; choose <span className="font-medium text-slate-600">Edit</span> on a row
                to change fields. Nest children under parents; save the graph to persist. Expand{' '}
                <span className="font-medium text-slate-600">Add account</span> below to create a new node.
              </p>
            </div>
            <div className="border-y border-teal-100 bg-teal-50/40 py-3">
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(8rem,0.75fr)_auto_auto] md:items-end">
                <label className="block text-xs font-medium text-slate-600">
                  Source account
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={linkFromRef}
                    onChange={e => setLinkFromRef(e.target.value)}
                    disabled={!canLinkAccounts || linkMut.isPending}
                    aria-label="Source account"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.data.spec.display_name} ({n.id})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="hidden pb-2 text-center text-sm font-semibold text-teal-800 md:block">→</div>
                <label className="block text-xs font-medium text-slate-600">
                  Destination account
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={linkToRef}
                    onChange={e => setLinkToRef(e.target.value)}
                    disabled={!canLinkAccounts || linkMut.isPending}
                    aria-label="Destination account"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.data.spec.display_name} ({n.id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Label
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    value={linkLabel}
                    onChange={e => setLinkLabel(e.target.value)}
                    disabled={!canLinkAccounts || linkMut.isPending}
                    placeholder="Sweep"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const state = startDirectionalAccountLink(linkFromRef)
                    setPendingLinkFromRef(state.pendingFromRef)
                    setLinkError(null)
                  }}
                  disabled={!canLinkAccounts || linkMut.isPending || !linkFromRef}
                  className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => submitDirectionalLink(linkFromRef, linkToRef, linkLabel)}
                  disabled={!canLinkAccounts || linkMut.isPending}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                >
                  {linkMut.isPending ? 'Linking…' : 'Link accounts'}
                </button>
              </div>
              {pendingLinkFromRef && (
                <p className="mt-2 text-xs text-teal-800">
                  Pending source: {nodeLabelByRef.get(pendingLinkFromRef) ?? pendingLinkFromRef}. Choose a destination input.
                </p>
              )}
              {(linkError || linkMut.isError) && (
                <p className="mt-2 text-xs text-red-700" role="alert">
                  {linkError ||
                    (linkMut.error instanceof Error ? linkMut.error.message : 'Could not link accounts')}
                </p>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full table-fixed text-xs" data-cash-flow-account-table>
                <thead>
                  <tr className="bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="w-[32%] px-3 py-2">Account</th>
                    <th className="w-[16%] px-3 py-2">Kind</th>
                    <th className="hidden w-[17%] px-3 py-2 lg:table-cell">Parent</th>
                    <th className="w-[24%] px-3 py-2">Balance</th>
                    <th className="hidden w-[14%] px-3 py-2 xl:table-cell">Detail</th>
                    <th className="hidden w-[7%] px-3 py-2 md:table-cell">
                      <span className="sr-only">Active</span>
                    </th>
                    <th className="w-[18%] px-3 py-2 text-right lg:w-[9%]">
                      <span className="sr-only">Row actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountListRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
                        No accounts yet. Expand <span className="font-medium text-slate-600">Add account</span> below
                        to create one.
                      </td>
                    </tr>
                  ) : null}
                  {accountListRows.map(({ node, depth }) => {
                    const spec = node.data.spec
                    const parentRef = spec.parent_ref?.trim()
                    const parentNode = parentRef ? nodes.find(n => n.id === parentRef) : undefined
                    const parentLabel =
                      parentNode?.data.spec.display_name?.trim() ||
                      (parentRef ? parentRef : null)
                    const balanceStr = spec.current_balance?.trim()
                    const hasBalance = Boolean(balanceStr)
                    const detailText = [spec.institution?.trim() || null, spec.account_mask?.trim() ? `*${spec.account_mask.trim()}` : null, spec.notes?.trim() ? 'Notes' : null]
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <tr
                        key={node.id}
                        className={`border-b border-slate-50 last:border-0 align-top transition-colors ${
                          node.id === selectedNodeId ? 'bg-teal-50/40' : ''
                        } hover:bg-slate-50/50`}
                      >
                        <td className="min-w-0 px-3 py-2.5">
                          <div style={{ paddingLeft: `${depth * 1.25}rem` }} className="min-h-[2.25rem] min-w-0">
                            <div className="truncate text-sm font-semibold leading-snug text-slate-800" title={spec.display_name}>
                              {spec.display_name}
                            </div>
                            <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400" title={node.id}>
                              {node.id}
                            </div>
                            {spec.institution?.trim() ? (
                              <div className="mt-0.5 truncate text-[10px] text-slate-500 xl:hidden" title={spec.institution}>
                                {spec.institution}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-sm capitalize text-slate-600">{cashNodeKindShortLabel(spec.kind)}</span>
                        </td>
                        <td className="hidden px-3 py-2.5 lg:table-cell">
                          <span className="block truncate text-sm text-slate-600" title={parentLabel || undefined}>
                            {parentLabel || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-0.5 text-sm">
                            {hasBalance || spec.balance_as_of ? (
                              <>
                                <div className="tabular-nums text-slate-800">
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    {(spec.currency ?? 'USD').toUpperCase()}
                                  </span>{' '}
                                  {hasBalance ? formatNodeBalance(spec.current_balance) : '—'}
                                </div>
                                <div className="truncate text-[11px] text-slate-500">
                                  {spec.balance_as_of
                                    ? formatBalanceDateLabel(spec.balance_as_of)
                                    : hasBalance
                                      ? 'No date'
                                      : ''}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-3 py-2.5 xl:table-cell">
                          <span className="block truncate text-sm text-slate-600" title={spec.notes?.trim() || detailText || undefined}>
                            {detailText || '—'}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2.5 md:table-cell">
                          <span
                            className={`inline-flex h-2.5 w-2.5 rounded-full ${
                              spec.is_active ?? true ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-300 ring-4 ring-slate-100'
                            }`}
                            aria-label={spec.is_active ?? true ? 'Active' : 'Inactive'}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle">
                          <button
                            type="button"
                            data-cash-flow-account-edit
                            onClick={() => setEditingAccountId(node.id)}
                            className="rounded-lg border border-teal-100 bg-white px-1.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 sm:px-2.5"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <details
              id={BUDGET_SCROLL_ANCHORS.addAccount}
              className="scroll-mt-24 rounded-lg border border-slate-100 bg-slate-50/50"
              open={addAccountPanelOpen}
              onToggle={e => onAddAccountPanelOpenChange(e.currentTarget.open)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50/90 [&::-webkit-details-marker]:hidden">
                <span>Add account</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {addAccountPanelOpen ? 'Hide' : 'Expand to add'}
                </span>
              </summary>
              <div className="border-t border-slate-100 bg-white px-4 py-4 space-y-3">
                <div className="grid gap-2 md:grid-cols-4">
                  <input
                    id="budget-add-account-first-field"
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
              </div>
            </details>
          </div>

          {editingAccountNode && typeof document !== 'undefined' &&
            (() => {
              const node = editingAccountNode
              const spec = node.data.spec
              return createPortal(
                <div
                  data-cash-flow-account-edit-modal
                  className="fixed inset-0 z-[230] flex items-stretch justify-center overflow-y-auto bg-slate-900/45 p-0 sm:p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="budget-edit-account-title"
                  onClick={e => {
                    if (e.target === e.currentTarget) closeAccountEditModal()
                  }}
                >
                  <div
                    className="flex min-h-[100dvh] w-full max-w-5xl flex-col border-slate-200 bg-white shadow-xl sm:min-h-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div className="min-w-0">
                        <h2 id="budget-edit-account-title" className="truncate text-lg font-semibold text-slate-800">
                          Edit account
                        </h2>
                        <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{node.id}</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close edit account"
                        onClick={closeAccountEditModal}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <span aria-hidden className="text-xl leading-none">
                          ×
                        </span>
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="grid gap-1 text-xs font-medium text-slate-600 sm:col-span-2">
                          Display name
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                            value={spec.display_name}
                            onChange={e => patchNode(node.id, { display_name: e.target.value })}
                            aria-label={`Display name for ${node.id}`}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Kind
                          <select
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize"
                            value={spec.kind}
                            onChange={e => patchNode(node.id, { kind: e.target.value as CashNodeKind })}
                          >
                            {KIND_OPTIONS.map(k => (
                              <option key={k} value={k}>
                                {cashNodeKindLabel(k)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Parent
                          <select
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={spec.parent_ref ?? ''}
                            onChange={e => patchNode(node.id, { parent_ref: e.target.value || null })}
                          >
                            <option value="">None</option>
                            {editingAccountParentOptions.map(n => (
                              <option key={n.id} value={n.id}>
                                {n.data.spec.display_name} ({n.id})
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600 sm:col-span-2">
                          Institution
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={spec.institution ?? ''}
                            onChange={e => patchNode(node.id, { institution: e.target.value || null })}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Currency
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
                            value={spec.currency ?? 'USD'}
                            onChange={e => patchNode(node.id, { currency: e.target.value.toUpperCase() })}
                            maxLength={3}
                            aria-label={`Currency for ${node.id}`}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Balance
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
                            value={spec.current_balance ?? ''}
                            onChange={e => patchNode(node.id, { current_balance: e.target.value.trim() || null })}
                            aria-label={`Current balance for ${node.id}`}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Balance date
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={spec.balance_as_of ?? ''}
                            onChange={e => patchNode(node.id, { balance_as_of: e.target.value || null })}
                            aria-label={`Balance date for ${node.id}`}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                          Mask
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={spec.account_mask ?? ''}
                            onChange={e => patchNode(node.id, { account_mask: e.target.value || null })}
                          />
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={spec.is_active ?? true}
                            onChange={e => patchNode(node.id, { is_active: e.target.checked })}
                            aria-label={`Active status for ${node.id}`}
                          />
                          Active
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-4">
                          Notes
                          <textarea
                            className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={spec.notes ?? ''}
                            onChange={e => patchNode(node.id, { notes: e.target.value })}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white px-4 py-3">
                      <button
                        type="button"
                        onClick={closeAccountEditModal}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            })()}

          {selectedEdge && selectedEdge.data?.spec && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Selected edge</div>
                <div className="text-sm font-semibold text-slate-800">
                  {nodeLabelByRef.get(selectedEdge.source) ?? selectedEdge.source} →{' '}
                  {nodeLabelByRef.get(selectedEdge.target) ?? selectedEdge.target}
                </div>
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
