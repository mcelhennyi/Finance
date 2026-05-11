import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { api } from '../api/client'
import {
  ALLOCATION_ITEM_CADENCES,
  PLAN_INCOME_CADENCES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  allocationItemCreateBody,
  allocationItemPutBody,
  formatUsd,
  graphNodeRefForPaymentMethod,
  validateItemDraft,
  type AllocationItemCadence,
  type ItemDraftInput,
  type PaymentMethod,
  type PlanIncomeCadence,
} from '../lib/budgetAllocation'
import { coverageAccountLabelFromGraph, planMoneyFlowPhrases } from '../lib/budgetPlanMoneyFlows'
import { firstOfMonthFromYm } from '../lib/monthRange'
import { loadBudgetPagePrefs, persistBudgetPagePrefs } from '../lib/budgetPagePrefs'
import type { AllocationItem, AllocationPlan, BudgetCategoryLinkedAllocationItem } from '../types'
import { BudgetDocsSectionLink, useBudgetDocs } from '../components/budget/BudgetDocsContext'
import { BUDGET_FIELD_TIPS } from '../components/budget/budgetFieldTips'
import { BUDGET_SCROLL_ANCHORS, type BudgetDocsSection } from '../components/budget/budgetDocAnchors'
import { CashFlowGraphPanel } from '../components/budget/CashFlowGraphPanel'
import { OutputHoverTip } from '../components/OutputHoverTip'

const BUDGET_CATEGORY_DATALIST_ID = 'finance-budget-category-datalist'

const EMPTY_GRAPH_HIGHLIGHT_REFS: string[] = []

function FieldLabel(props: { children: string; tip?: string }) {
  const { children, tip } = props
  if (!tip) return <span className="text-slate-500">{children}</span>
  return (
    <OutputHoverTip tip={tip} dashed={false} placement="below" className="text-slate-500 inline">
      {children}
    </OutputHoverTip>
  )
}

function Kpi(props: { label: string; value: string; sub?: string; labelTip?: string }) {
  const { label, value, sub, labelTip } = props
  const labelEl = labelTip ? (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
      <OutputHoverTip tip={labelTip} dashed={false} placement="below" className="inline">
        {label}
      </OutputHoverTip>
    </div>
  ) : (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
  )
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3 min-h-[5.5rem]">
      {labelEl}
      <div className="text-xl font-bold tabular-nums text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function SectionTitle(props: { children: string; docsSection?: BudgetDocsSection }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{props.children}</h2>
      {props.docsSection ? <BudgetDocsSectionLink section={props.docsSection} /> : null}
    </div>
  )
}

function itemToDraft(item: AllocationItem): ItemDraftInput {
  return {
    item_name: item.item_name,
    category: item.category,
    planned_amount: String(item.planned_amount),
    cadence: (ALLOCATION_ITEM_CADENCES.includes(item.cadence as AllocationItemCadence)
      ? item.cadence
      : 'monthly') as AllocationItemCadence,
    payment_method: (PAYMENT_METHODS.includes(item.payment_method as PaymentMethod)
      ? item.payment_method
      : 'cash') as PaymentMethod,
    due_day: item.due_day != null ? String(item.due_day) : '',
    notes: item.notes ?? '',
  }
}

function emptyDraft(): ItemDraftInput {
  return {
    item_name: '',
    category: '',
    planned_amount: '',
    cadence: 'monthly',
    payment_method: 'cash',
    due_day: '',
    notes: '',
  }
}

export function BudgetPage() {
  const queryClient = useQueryClient()
  const [ym, setYm] = useState(() => loadBudgetPagePrefs().ym)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(() => loadBudgetPagePrefs().planId)
  const [planNameDraft, setPlanNameDraft] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeCadence, setIncomeCadence] = useState<PlanIncomeCadence | ''>('')
  const [newItem, setNewItem] = useState<ItemDraftInput>(emptyDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ItemDraftInput | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadModalOpen, setLoadModalOpen] = useState(false)
  const [addDestinationModalOpen, setAddDestinationModalOpen] = useState(false)
  const [addLinePanelOpen, setAddLinePanelOpen] = useState(false)
  const [addCategoryPanelOpen, setAddCategoryPanelOpen] = useState(false)
  const [addAccountPanelOpen, setAddAccountPanelOpen] = useState(false)
  const newItemFirstFieldRef = useRef<HTMLInputElement>(null)
  const newCatalogInputRef = useRef<HTMLInputElement>(null)
  const [graphPayHoverNodeRef, setGraphPayHoverNodeRef] = useState<string | null>(null)
  const [newCatalogLabel, setNewCatalogLabel] = useState('')
  const [expandedCategoryLabel, setExpandedCategoryLabel] = useState<string | null>(null)
  const [categoryLineDrafts, setCategoryLineDrafts] = useState<Record<number, string>>({})
  const [updatingCategoryLineId, setUpdatingCategoryLineId] = useState<number | null>(null)

  const { openDocs } = useBudgetDocs()
  const barBottom = 'max(0.75rem, env(safe-area-inset-bottom, 0px))'

  const monthIso = firstOfMonthFromYm(ym)
  const monthLabel = useMemo(() => {
    if (!monthIso) return ym
    try {
      return format(new Date(monthIso + 'T12:00:00'), 'MMMM yyyy')
    } catch {
      return monthIso
    }
  }, [monthIso, ym])

  const graphHighlightNodeRefs = useMemo(
    () => (graphPayHoverNodeRef ? [graphPayHoverNodeRef] : EMPTY_GRAPH_HIGHLIGHT_REFS),
    [graphPayHoverNodeRef],
  )

  useEffect(() => {
    persistBudgetPagePrefs({ ym, planId: selectedPlanId })
  }, [ym, selectedPlanId])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['budgetPlans'] })
    queryClient.invalidateQueries({ queryKey: ['budgetPlansAll'] })
    queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    queryClient.invalidateQueries({ queryKey: ['budgetSummary'] })
    queryClient.invalidateQueries({ queryKey: ['budgetCashFlowGraph'] })
    queryClient.invalidateQueries({ queryKey: ['unifiedViewSummary'] })
    queryClient.invalidateQueries({ queryKey: ['budgetCategoryOptions'] })
    queryClient.invalidateQueries({ queryKey: ['budgetCategoryInventory'] })
  }

  const plansQuery = useQuery({
    queryKey: ['budgetPlans', monthIso],
    queryFn: () => api.listBudgetAllocationPlans(monthIso),
    enabled: Boolean(monthIso),
  })

  const allPlansQuery = useQuery({
    queryKey: ['budgetPlansAll'],
    queryFn: () => api.listAllBudgetAllocationPlans(),
    enabled: loadModalOpen,
  })

  const plans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data])

  useEffect(() => {
    if (!plans.length) {
      setSelectedPlanId(null)
      return
    }
    setSelectedPlanId(cur => {
      if (cur != null && plans.some(p => p.id === cur)) return cur
      return plans[0].id
    })
  }, [plans])

  const activePlan: AllocationPlan | null = useMemo(
    () => plans.find(p => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  )

  useEffect(() => {
    if (!activePlan) {
      setPlanNameDraft('')
      setIncomeAmount('')
      setIncomeCadence('')
      return
    }
    setPlanNameDraft(activePlan.name)
    setIncomeAmount(activePlan.income_amount != null ? String(activePlan.income_amount) : '')
    setIncomeCadence((activePlan.income_cadence as PlanIncomeCadence) || '')
  }, [activePlan])

  const itemsQuery = useQuery({
    queryKey: ['budgetItems', selectedPlanId],
    queryFn: () => api.listBudgetAllocationItems(selectedPlanId!),
    enabled: selectedPlanId != null,
  })

  const planGraphQuery = useQuery({
    queryKey: ['budgetCashFlowGraph', selectedPlanId],
    queryFn: () => api.getBudgetCashFlowGraph(selectedPlanId!),
    enabled: selectedPlanId != null,
  })

  const planMoneyFlows = useMemo(
    () => planMoneyFlowPhrases(planGraphQuery.data ?? undefined),
    [planGraphQuery.data],
  )

  const categoryOptionsQuery = useQuery({
    queryKey: ['budgetCategoryOptions'],
    queryFn: () => api.listBudgetCategoryOptions(),
  })

  const categoryInventoryQuery = useQuery({
    queryKey: ['budgetCategoryInventory'],
    queryFn: () => api.listBudgetCategoryInventory(),
  })

  const categoryInventoryItemsQuery = useQuery({
    queryKey: ['budgetCategoryInventoryItems', expandedCategoryLabel],
    queryFn: () => api.listBudgetCategoryInventoryItems(expandedCategoryLabel!),
    enabled: expandedCategoryLabel != null,
  })

  const updateCategoryLineMut = useMutation({
    mutationFn: ({ line, replacement }: { line: BudgetCategoryLinkedAllocationItem; replacement: string }) =>
      api.updateBudgetAllocationItem(line.plan_id, line.id, { category: replacement }),
    onSuccess: (_item, vars) => {
      setCategoryLineDrafts(cur => {
        const next = { ...cur }
        delete next[vars.line.id]
        return next
      })
      invalidateAll()
      queryClient.invalidateQueries({ queryKey: ['budgetCategoryInventoryItems'] })
    },
    onSettled: () => {
      setUpdatingCategoryLineId(null)
    },
  })

  const categoryPickerLabels = useMemo(
    () => categoryOptionsQuery.data?.labels ?? [],
    [categoryOptionsQuery.data],
  )

  const addCatalogMut = useMutation({
    mutationFn: (label: string) => api.createBudgetCategoryCatalogEntry({ label }),
    onSuccess: () => {
      setNewCatalogLabel('')
      invalidateAll()
    },
  })

  const deleteCatalogMut = useMutation({
    mutationFn: (id: number) => api.deleteBudgetCategoryCatalogEntry(id),
    onSuccess: () => invalidateAll(),
  })

  const summaryQuery = useQuery({
    queryKey: ['budgetSummary', selectedPlanId],
    queryFn: () => api.budgetAllocationSummary(selectedPlanId!),
    enabled: selectedPlanId != null,
  })

  const createPlanMut = useMutation({
    mutationFn: () =>
      api.createBudgetAllocationPlan({
        period_month: monthIso,
        currency: 'USD',
      }),
    onSuccess: (plan: AllocationPlan) => {
      setSelectedPlanId(plan.id)
      invalidateAll()
    },
  })

  const updatePlanMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.updateBudgetAllocationPlan(selectedPlanId!, body),
    onSuccess: () => invalidateAll(),
  })

  const deletePlanMut = useMutation({
    mutationFn: () => api.deleteBudgetAllocationPlan(selectedPlanId!),
    onSuccess: () => {
      setSelectedPlanId(null)
      invalidateAll()
    },
  })

  const createItemMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.createBudgetAllocationItem(selectedPlanId!, body),
    onSuccess: () => {
      setNewItem(emptyDraft())
      setFormError(null)
      invalidateAll()
    },
  })

  const updateItemMut = useMutation({
    mutationFn: ({ itemId, body }: { itemId: number; body: Record<string, unknown> }) =>
      api.updateBudgetAllocationItem(selectedPlanId!, itemId, body),
    onSuccess: () => {
      setEditingId(null)
      setEditDraft(null)
      invalidateAll()
    },
  })

  const deleteItemMut = useMutation({
    mutationFn: (itemId: number) => api.deleteBudgetAllocationItem(selectedPlanId!, itemId),
    onSuccess: () => invalidateAll(),
  })

  const plansErr = plansQuery.error instanceof Error ? plansQuery.error.message : null
  const itemsErr = itemsQuery.error instanceof Error ? itemsQuery.error.message : null
  const summaryErr = summaryQuery.error instanceof Error ? summaryQuery.error.message : null

  const handleSavePlanMeta = () => {
    if (selectedPlanId == null) return
    setFormError(null)
    const body: Record<string, unknown> = {
      name: planNameDraft.trim() || activePlan?.name || 'Plan',
    }
    const amt = incomeAmount.trim()
    const hasIncome = amt !== '' && incomeCadence !== ''
    if (hasIncome) {
      const n = Number(amt)
      if (!Number.isFinite(n) || n <= 0) {
        setFormError('Income amount must be a positive number when cadence is set.')
        return
      }
      body.income_amount = String(n)
      body.income_cadence = incomeCadence
    } else if (amt === '' && incomeCadence === '') {
      body.income_amount = null
      body.income_cadence = null
    } else {
      setFormError('Set both income amount and cadence, or clear both.')
      return
    }
    updatePlanMut.mutate(body)
  }

  const handleAddItem = () => {
    if (selectedPlanId == null) return
    const err = validateItemDraft(newItem)
    if (err) {
      setFormError(err)
      return
    }
    setFormError(null)
    try {
      createItemMut.mutate(allocationItemCreateBody(newItem))
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Invalid item')
    }
  }

  const handleSaveEdit = () => {
    if (selectedPlanId == null || editingId == null || !editDraft) return
    try {
      const body = allocationItemPutBody(editDraft)
      updateItemMut.mutate({ itemId: editingId, body })
      setFormError(null)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Invalid item')
    }
  }

  const formatPlanPeriodLabel = (periodMonth: string) => {
    try {
      return format(parseISO(periodMonth.slice(0, 10) + 'T12:00:00'), 'MMMM yyyy')
    } catch {
      return periodMonth.slice(0, 7)
    }
  }

  const handleLoadSavedPlan = (plan: AllocationPlan) => {
    const ymNext = plan.period_month.slice(0, 7)
    setYm(ymNext)
    setSelectedPlanId(plan.id)
    persistBudgetPagePrefs({ ym: ymNext, planId: plan.id })
    invalidateAll()
    setLoadModalOpen(false)
  }

  useEffect(() => {
    if (!loadModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLoadModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loadModalOpen])

  useEffect(() => {
    if (!addDestinationModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddDestinationModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addDestinationModalOpen])

  const goToAddAllocationLine = useCallback(() => {
    setAddDestinationModalOpen(false)
    setAddLinePanelOpen(true)
    setAddCategoryPanelOpen(false)
    setAddAccountPanelOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById(BUDGET_SCROLL_ANCHORS.add)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.requestAnimationFrame(() => newItemFirstFieldRef.current?.focus())
    })
  }, [])

  const goToAddSavedCategory = useCallback(() => {
    setAddDestinationModalOpen(false)
    setAddCategoryPanelOpen(true)
    setAddLinePanelOpen(false)
    setAddAccountPanelOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById(BUDGET_SCROLL_ANCHORS.addCategory)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.requestAnimationFrame(() => newCatalogInputRef.current?.focus())
    })
  }, [])

  const goToAddAccount = useCallback(() => {
    setAddDestinationModalOpen(false)
    setAddAccountPanelOpen(true)
    setAddLinePanelOpen(false)
    setAddCategoryPanelOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById(BUDGET_SCROLL_ANCHORS.addAccount)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.requestAnimationFrame(() => document.getElementById('budget-add-account-first-field')?.focus())
    })
  }, [])

  return (
    <>
    <div id={BUDGET_SCROLL_ANCHORS.top} className="space-y-8 pb-28">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Budget allocation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Plan recurring amounts by category for a month. Totals sync to the unified view as category budgets.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => setLoadModalOpen(true)}
            className="inline-flex items-center rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Load saved plan…
          </button>
          <span className="text-[11px] text-slate-500 max-w-md">
            Opens the same picker as the floating bar — choose a plan to jump to its month and lines.
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600 border border-slate-100 rounded-lg px-3 py-2.5 bg-slate-50/85">
          <span className="font-semibold text-slate-700">Inline help.</span> Hover underlined labels for short definitions.
          Open the full guide from the floating bar or{' '}
          <BudgetDocsSectionLink
            section="intro"
            label="start here ›"
            className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
          />
        </p>
      </div>

      <div id={BUDGET_SCROLL_ANCHORS.period} className="flex flex-wrap items-end gap-4 scroll-mt-24">
        <label className="flex flex-col gap-1 text-sm">
          <FieldLabel tip={BUDGET_FIELD_TIPS.month}>Month</FieldLabel>
          <input
            type="month"
            value={ym}
            onChange={e => setYm(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>
        {plans.length >= 1 && (
          <label className="flex flex-col gap-1 text-sm min-w-[12rem]">
            <FieldLabel tip={BUDGET_FIELD_TIPS.planSelect}>Budget</FieldLabel>
            <select
              id="budget-plan-select"
              aria-label="Select allocation plan"
              value={selectedPlanId ?? ''}
              onChange={e => setSelectedPlanId(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </select>
          </label>
        )}
        {plans.length >= 1 && monthIso && (
          <button
            type="button"
            onClick={() => createPlanMut.mutate()}
            disabled={!monthIso || createPlanMut.isPending}
            className="mb-0.5 text-sm font-medium text-teal-700 hover:text-teal-900 border border-teal-200 rounded-lg px-3 py-2 disabled:opacity-50 self-end"
          >
            {createPlanMut.isPending ? 'Creating…' : 'Add another plan'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <BudgetDocsSectionLink section="monthAndPlans" label="Months & plans ›" />
        <BudgetDocsSectionLink section="cashFlowMap" label="Cash flow visualization ›" />
        <BudgetDocsSectionLink section="unifiedSync" label="Unified view sync ›" />
        {plans.length > 0 && (
          <a
            href={`#${BUDGET_SCROLL_ANCHORS.categories}`}
            className="font-semibold text-teal-700 hover:text-teal-900"
          >
            Categories ›
          </a>
        )}
      </div>

      {plansQuery.isLoading && <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />}

      {plansQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <strong className="font-semibold">Could not load plans.</strong> {plansErr}
        </div>
      )}

      {!plansQuery.isLoading && !plansQuery.isError && !plans.length && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-slate-600 text-sm">No allocation plan for {monthLabel} yet.</p>
          <button
            type="button"
            onClick={() => createPlanMut.mutate()}
            disabled={createPlanMut.isPending || !monthIso}
            className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg px-4 py-2"
          >
            {createPlanMut.isPending ? 'Creating…' : `Create plan for ${monthLabel}`}
          </button>
        </div>
      )}

      {activePlan && (
        <>
          <div id={BUDGET_SCROLL_ANCHORS.plan} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4 scroll-mt-24">
            <SectionTitle docsSection="planDetails">Plan</SectionTitle>
            <div className="flex flex-wrap gap-4 items-end">
              <label className="flex flex-col gap-1 text-sm flex-1 min-w-[12rem]">
                <FieldLabel tip={BUDGET_FIELD_TIPS.planName}>Name</FieldLabel>
                <input
                  type="text"
                  value={planNameDraft}
                  onChange={e => setPlanNameDraft(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm w-36">
                <FieldLabel tip={BUDGET_FIELD_TIPS.incomeAmount}>Income (optional)</FieldLabel>
                <input
                  type="text"
                  inputMode="decimal"
                  value={incomeAmount}
                  onChange={e => setIncomeAmount(e.target.value)}
                  placeholder="Amount"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm min-w-[10rem]">
                <FieldLabel tip={BUDGET_FIELD_TIPS.incomeCadence}>Income cadence</FieldLabel>
                <select
                  value={incomeCadence}
                  onChange={e => setIncomeCadence(e.target.value as PlanIncomeCadence | '')}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">—</option>
                  {PLAN_INCOME_CADENCES.map(c => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePlanMeta}
                  disabled={updatePlanMut.isPending}
                  className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg px-4 py-2"
                >
                  {updatePlanMut.isPending ? 'Saving…' : 'Save plan'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoadModalOpen(true)}
                  className="text-sm font-semibold rounded-lg border-2 border-teal-600 bg-white px-4 py-2 text-teal-900 shadow-sm hover:bg-teal-50"
                >
                  Load…
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this plan and all its allocation lines?')) {
                      deletePlanMut.mutate()
                    }
                  }}
                  disabled={deletePlanMut.isPending}
                  className="text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-50"
                >
                  Delete plan
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">Period {activePlan.period_month} · currency {activePlan.currency}</p>
          </div>

          {summaryQuery.isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          )}

          {summaryQuery.isError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Summary unavailable: {summaryErr}
            </div>
          )}

          {summaryQuery.data && !summaryQuery.isLoading && (
            <div id={BUDGET_SCROLL_ANCHORS.summary} className="scroll-mt-24">
              <SectionTitle docsSection="summary">Monthly summary</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi
                  label="Total allocated"
                  labelTip={BUDGET_FIELD_TIPS.kpi.totalAllocated}
                  value={formatUsd(summaryQuery.data.total_monthly_allocated)}
                />
                <Kpi
                  label="Checking"
                  labelTip={BUDGET_FIELD_TIPS.kpi.cash}
                  value={formatUsd(summaryQuery.data.cash_allocated)}
                />
                <Kpi
                  label="Chase"
                  labelTip={BUDGET_FIELD_TIPS.kpi.credit}
                  value={formatUsd(summaryQuery.data.credit_allocated)}
                />
                <Kpi
                  label="Remaining income"
                  labelTip={BUDGET_FIELD_TIPS.kpi.remainingIncome}
                  value={
                    summaryQuery.data.remaining_income == null
                      ? '—'
                      : formatUsd(summaryQuery.data.remaining_income)
                  }
                />
              </div>
            </div>
          )}

          <div id={BUDGET_SCROLL_ANCHORS.cashFlowGraph} className="scroll-mt-24">
            <SectionTitle docsSection="cashFlowMap">Cash flow map</SectionTitle>
            <CashFlowGraphPanel
              planId={selectedPlanId}
              planIncomeMonthly={activePlan?.income_monthly ?? null}
              highlightNodeRefs={graphHighlightNodeRefs}
              addAccountPanelOpen={addAccountPanelOpen}
              onAddAccountPanelOpenChange={setAddAccountPanelOpen}
            />
          </div>

          {activePlan && (
            <div id={BUDGET_SCROLL_ANCHORS.planMoneyFlows} className="scroll-mt-24">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  <OutputHoverTip
                    tip={BUDGET_FIELD_TIPS.planMoneyFlows}
                    dashed={false}
                    placement="below"
                    className="inline"
                  >
                    Plan inflows & outflows
                  </OutputHoverTip>
                </h2>
              </div>
              {planGraphQuery.isError ? (
                <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                  Could not load the plan graph, so inflows and outflows are unavailable.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-sm">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">Inflows</div>
                    {planGraphQuery.isLoading ? (
                      <p className="text-xs text-slate-400">Loading…</p>
                    ) : planMoneyFlows.inflows.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No inflow edges in the map yet (e.g. income → checking, savings → checking).
                      </p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                        {planMoneyFlows.inflows.map((line, i) => (
                          <li key={`in-${i}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">Outflows</div>
                    {planGraphQuery.isLoading ? (
                      <p className="text-xs text-slate-400">Loading…</p>
                    ) : planMoneyFlows.outflows.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No outflow edges in the map yet (e.g. checking → card or brokerage).
                      </p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                        {planMoneyFlows.outflows.map((line, i) => (
                          <li key={`out-${i}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <datalist id={BUDGET_CATEGORY_DATALIST_ID}>
            {categoryPickerLabels.map(label => (
              <option key={label} value={label} />
            ))}
          </datalist>

          <div id={BUDGET_SCROLL_ANCHORS.categories} className="scroll-mt-24">
            <SectionTitle>Categories</SectionTitle>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Each row is a category string. <strong>Lines</strong> counts allocation rows using that category
                (all plans). <strong>Saved</strong> means the label is stored for quick pick — new lines and budget
                seeding add categories here automatically. Open a nonzero line count to reassign individual lines;
                delete is available once no allocation lines use the saved category.
              </p>
              {categoryOptionsQuery.isError && (
                <p className="text-xs text-red-700" role="alert">
                  Could not load merged category suggestions.
                </p>
              )}
              {categoryInventoryQuery.isError && (
                <p className="text-xs text-red-700" role="alert">
                  Could not load category inventory.
                </p>
              )}
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm min-w-[28rem]">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/90 border-b border-slate-100">
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 tabular-nums">Lines</th>
                      <th className="px-3 py-2">Saved</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryInventoryQuery.isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-xs text-slate-400">
                          Loading…
                        </td>
                      </tr>
                    ) : (categoryInventoryQuery.data?.items.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-xs text-slate-500">
                          No categories yet. Add a saved name or create allocation lines.
                        </td>
                      </tr>
                    ) : (
                      (categoryInventoryQuery.data?.items ?? []).map(row => {
                        const isExpanded = expandedCategoryLabel === row.label
                        const linkedLines = categoryInventoryItemsQuery.data?.items ?? []
                        return (
                          <Fragment key={row.label}>
                            <tr className="border-b border-slate-50 last:border-0">
                              <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                              <td className="px-3 py-2 tabular-nums text-slate-700">
                                {row.allocation_item_count > 0 ? (
                                  <button
                                    type="button"
                                    className="font-semibold text-teal-700 underline decoration-dotted underline-offset-2 hover:text-teal-900"
                                    aria-expanded={isExpanded}
                                    onClick={() =>
                                      setExpandedCategoryLabel(cur => (cur === row.label ? null : row.label))
                                    }
                                  >
                                    {row.allocation_item_count}
                                  </button>
                                ) : (
                                  row.allocation_item_count
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{row.catalog_id != null ? 'Yes' : '—'}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                                {row.catalog_id != null && row.allocation_item_count === 0 && (
                                  <button
                                    type="button"
                                    className="text-xs font-semibold text-red-700 hover:text-red-900"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Delete saved category "${row.label}" from the list? (No allocation lines use it.)`,
                                        )
                                      ) {
                                        deleteCatalogMut.mutate(row.catalog_id!)
                                      }
                                    }}
                                    disabled={deleteCatalogMut.isPending}
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-slate-100 bg-slate-50/60">
                                <td colSpan={4} className="px-3 py-3">
                                  {categoryInventoryItemsQuery.isLoading ? (
                                    <p className="text-xs text-slate-400">Loading linked lines…</p>
                                  ) : categoryInventoryItemsQuery.isError ? (
                                    <p className="text-xs text-red-700" role="alert">
                                      Could not load linked allocation lines.
                                    </p>
                                  ) : linkedLines.length === 0 ? (
                                    <p className="text-xs text-slate-500">No linked lines remain for this category.</p>
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
                                      <table className="w-full min-w-[42rem] text-xs">
                                        <thead>
                                          <tr className="bg-white text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-3 py-2">Plan</th>
                                            <th className="px-3 py-2">Line</th>
                                            <th className="px-3 py-2 tabular-nums">Monthly</th>
                                            <th className="px-3 py-2">Current</th>
                                            <th className="px-3 py-2">Replacement</th>
                                            <th className="px-3 py-2 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {linkedLines.map(line => {
                                            const draft = categoryLineDrafts[line.id] ?? ''
                                            const replacement = draft.trim()
                                            return (
                                              <tr key={line.id} className="border-b border-slate-50 last:border-0">
                                                <td className="px-3 py-2 text-slate-600">
                                                  <div className="font-medium text-slate-800">{line.plan_name}</div>
                                                  <div>{formatPlanPeriodLabel(line.period_month)}</div>
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">
                                                  <div className="font-medium text-slate-800">{line.item_name}</div>
                                                  <div className="text-slate-500">{line.cadence.replace(/_/g, ' ')}</div>
                                                </td>
                                                <td className="px-3 py-2 tabular-nums text-slate-700">
                                                  {formatUsd(line.monthly_amount)}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">{line.category}</td>
                                                <td className="px-3 py-2">
                                                  <input
                                                    className="w-full rounded border border-slate-200 px-2 py-1"
                                                    value={draft}
                                                    onChange={e =>
                                                      setCategoryLineDrafts(cur => ({
                                                        ...cur,
                                                        [line.id]: e.target.value,
                                                      }))
                                                    }
                                                    list={BUDGET_CATEGORY_DATALIST_ID}
                                                    placeholder="New category"
                                                    maxLength={100}
                                                    aria-label={`Replacement category for ${line.item_name}`}
                                                  />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                  <button
                                                    type="button"
                                                    disabled={
                                                      updateCategoryLineMut.isPending ||
                                                      !replacement ||
                                                      replacement === line.category
                                                    }
                                                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50"
                                                    onClick={() => {
                                                      if (!replacement || replacement === line.category) return
                                                      setUpdatingCategoryLineId(line.id)
                                                      updateCategoryLineMut.mutate({ line, replacement })
                                                    }}
                                                  >
                                                    {updatingCategoryLineId === line.id ? 'Saving…' : 'Relink'}
                                                  </button>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <details
                id={BUDGET_SCROLL_ANCHORS.addCategory}
                className="scroll-mt-24 rounded-lg border border-slate-100 bg-slate-50/50"
                open={addCategoryPanelOpen}
                onToggle={e => setAddCategoryPanelOpen(e.currentTarget.open)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50/90 [&::-webkit-details-marker]:hidden">
                  <span>Add saved category</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {addCategoryPanelOpen ? 'Hide' : 'Expand to add'}
                  </span>
                </summary>
                <div className="border-t border-slate-100 bg-white px-4 py-4 space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Store a label for quick pick on new allocation lines. Lines and seeding can also create categories
                    automatically.
                  </p>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1 text-sm min-w-[12rem] flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        Category name
                      </span>
                      <input
                        ref={newCatalogInputRef}
                        type="text"
                        value={newCatalogLabel}
                        onChange={e => setNewCatalogLabel(e.target.value)}
                        placeholder="e.g. Childcare"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                        list={BUDGET_CATEGORY_DATALIST_ID}
                        maxLength={100}
                        aria-label="New saved category name"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const t = newCatalogLabel.trim()
                        if (!t) return
                        addCatalogMut.mutate(t)
                      }}
                      disabled={addCatalogMut.isPending || !newCatalogLabel.trim()}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {addCatalogMut.isPending ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                  {addCatalogMut.isError && (
                    <p className="text-xs text-red-700" role="alert">
                      {addCatalogMut.error instanceof Error ? addCatalogMut.error.message : 'Add failed'}
                    </p>
                  )}
                </div>
              </details>
            </div>
          </div>

          {itemsQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load items: {itemsErr}
            </div>
          )}

          <div id={BUDGET_SCROLL_ANCHORS.lines} className="scroll-mt-24">
            <SectionTitle docsSection="allocationLines">Allocation lines</SectionTitle>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/80">
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.item} dashed={false} placement="below" className="inline font-semibold">
                          Item
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.category} dashed={false} placement="below" className="inline font-semibold">
                          Category
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.planned} dashed={false} placement="below" className="inline font-semibold">
                          Planned
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.cadence} dashed={false} placement="below" className="inline font-semibold">
                          Cadence
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.monthly} dashed={false} placement="below" className="inline font-semibold">
                          Monthly
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.account} dashed={false} placement="below" className="inline font-semibold">
                          Account
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.due} dashed={false} placement="below" className="inline font-semibold">
                          Due
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3 min-w-[8rem]">
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.notes} dashed={false} placement="below" className="inline font-semibold">
                          Notes
                        </OutputHoverTip>
                      </th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(itemsQuery.data?.items ?? []).map(item =>
                      editingId === item.id && editDraft ? (
                        <tr key={item.id} className="border-b border-slate-50 bg-teal-50/40 align-top">
                          <td className="px-3 py-2">
                            <input
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={editDraft.item_name}
                              onChange={e => setEditDraft({ ...editDraft, item_name: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={editDraft.category}
                              onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
                              list={BUDGET_CATEGORY_DATALIST_ID}
                              aria-label="Category"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full rounded border border-slate-200 px-2 py-1 tabular-nums"
                              value={editDraft.planned_amount}
                              onChange={e => setEditDraft({ ...editDraft, planned_amount: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={editDraft.cadence}
                              onChange={e =>
                                setEditDraft({
                                  ...editDraft,
                                  cadence: e.target.value as AllocationItemCadence,
                                })
                              }
                            >
                              {ALLOCATION_ITEM_CADENCES.map(c => (
                                <option key={c} value={c}>
                                  {c.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-slate-500 tabular-nums">{formatUsd(item.monthly_amount)}</td>
                          <td
                            className="px-3 py-2"
                            onMouseEnter={() =>
                              setGraphPayHoverNodeRef(
                                graphNodeRefForPaymentMethod(editDraft.payment_method),
                              )
                            }
                            onMouseLeave={() => setGraphPayHoverNodeRef(null)}
                          >
                            <select
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={editDraft.payment_method}
                              onChange={e =>
                                setEditDraft({
                                  ...editDraft,
                                  payment_method: e.target.value as PaymentMethod,
                                })
                              }
                            >
                              {PAYMENT_METHODS.map(c => (
                                <option key={c} value={c}>
                                  {PAYMENT_METHOD_LABELS[c]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-14 rounded border border-slate-200 px-2 py-1"
                              value={editDraft.due_day}
                              onChange={e => setEditDraft({ ...editDraft, due_day: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full rounded border border-slate-200 px-2 py-1"
                              value={editDraft.notes}
                              onChange={e => setEditDraft({ ...editDraft, notes: e.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={updateItemMut.isPending}
                              className="text-xs font-semibold text-white bg-teal-600 rounded-lg px-2 py-1"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null)
                                setEditDraft(null)
                              }}
                              className="text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-medium text-slate-800">{item.item_name}</td>
                          <td className="px-3 py-2 text-slate-600">{item.category}</td>
                          <td className="px-3 py-2 tabular-nums">{formatUsd(item.planned_amount)}</td>
                          <td className="px-3 py-2 text-slate-500">{item.cadence.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2 tabular-nums text-teal-800 font-medium">
                            {formatUsd(item.monthly_amount)}
                          </td>
                          <td
                            className="px-3 py-2 text-slate-600"
                            onMouseEnter={() =>
                              setGraphPayHoverNodeRef(
                                graphNodeRefForPaymentMethod(
                                  PAYMENT_METHODS.includes(item.payment_method as PaymentMethod)
                                    ? (item.payment_method as PaymentMethod)
                                    : 'cash',
                                ),
                              )
                            }
                            onMouseLeave={() => setGraphPayHoverNodeRef(null)}
                          >
                            {(() => {
                              const pm = PAYMENT_METHODS.includes(item.payment_method as PaymentMethod)
                                ? (item.payment_method as PaymentMethod)
                                : 'cash'
                              return (
                                <span className="font-medium text-slate-800">
                                  {coverageAccountLabelFromGraph(pm, planGraphQuery.data ?? undefined)}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{item.due_day ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-xs truncate" title={item.notes}>
                            {item.notes || '—'}
                          </td>
                          <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id)
                                setEditDraft(itemToDraft(item))
                              }}
                              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Remove this allocation line?')) {
                                  deleteItemMut.mutate(item.id)
                                }
                              }}
                              disabled={deleteItemMut.isPending}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {(itemsQuery.data?.items.length ?? 0) === 0 && !itemsQuery.isLoading && (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  No lines yet. Expand <span className="font-medium text-slate-600">Add line</span> below to create one.
                </p>
              )}

              <details
                id={BUDGET_SCROLL_ANCHORS.add}
                className="scroll-mt-24 border-t border-slate-100 bg-slate-50/50"
                open={addLinePanelOpen}
                onToggle={e => setAddLinePanelOpen(e.currentTarget.open)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50/90 [&::-webkit-details-marker]:hidden">
                  <span className="flex flex-wrap items-center gap-2">
                    Add line
                    <BudgetDocsSectionLink section="addLine" label="Line fields ›" className="text-[10px] font-normal" />
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {addLinePanelOpen ? 'Hide' : 'Expand to add'}
                  </span>
                </summary>
                <div className="border-t border-slate-100 bg-white px-4 py-4 space-y-3">
                  <div className="flex flex-wrap gap-3 items-end">
                    <input
                      ref={newItemFirstFieldRef}
                      placeholder="Item name"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm min-w-[8rem]"
                      value={newItem.item_name}
                      onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                    />
                    <input
                      placeholder="Category"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm min-w-[8rem]"
                      value={newItem.category}
                      onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                      list={BUDGET_CATEGORY_DATALIST_ID}
                      aria-label="Category"
                    />
                    <input
                      placeholder="Amount"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24 tabular-nums"
                      value={newItem.planned_amount}
                      onChange={e => setNewItem({ ...newItem, planned_amount: e.target.value })}
                    />
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={newItem.cadence}
                      onChange={e =>
                        setNewItem({ ...newItem, cadence: e.target.value as AllocationItemCadence })
                      }
                    >
                      {ALLOCATION_ITEM_CADENCES.map(c => (
                        <option key={c} value={c}>
                          {c.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={newItem.payment_method}
                      onChange={e =>
                        setNewItem({ ...newItem, payment_method: e.target.value as PaymentMethod })
                      }
                    >
                      {PAYMENT_METHODS.map(c => (
                        <option key={c} value={c}>
                          {PAYMENT_METHOD_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Due day"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-20"
                      value={newItem.due_day}
                      onChange={e => setNewItem({ ...newItem, due_day: e.target.value })}
                    />
                    <input
                      placeholder="Notes"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[10rem]"
                      value={newItem.notes}
                      onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={createItemMut.isPending}
                      className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg px-4 py-2"
                    >
                      {createItemMut.isPending ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
              {formError}
            </div>
          )}

          {(createPlanMut.error ||
            updatePlanMut.error ||
            deletePlanMut.error ||
            createItemMut.error ||
            updateItemMut.error ||
            deleteItemMut.error ||
            deleteCatalogMut.error ||
            updateCategoryLineMut.error) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
              {[
                createPlanMut.error,
                updatePlanMut.error,
                deletePlanMut.error,
                createItemMut.error,
                updateItemMut.error,
                deleteItemMut.error,
                deleteCatalogMut.error,
                updateCategoryLineMut.error,
              ]
                .filter(Boolean)
                .map(e => (e instanceof Error ? e.message : String(e)))
                .join(' ')}
            </div>
          )}
        </>
      )}

    </div>
    {createPortal(
      <>
        <div
          className="fixed inset-x-0 z-[200] flex justify-center pointer-events-none px-2"
          style={{ bottom: barBottom }}
          role="region"
          aria-label="Budget page controls"
        >
          <div className="pointer-events-auto flex max-w-[min(56rem,calc(100vw-1rem))] flex-col items-stretch gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-lg shadow-slate-900/15 backdrop-blur-sm ring-1 ring-slate-900/5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 sm:px-3 sm:py-2.5">
            <div className="flex min-w-0 flex-1 justify-center gap-2 sm:flex-initial sm:justify-start">
              <button
                type="button"
                aria-label="Save plan name and income"
                onClick={handleSavePlanMeta}
                disabled={!activePlan || updatePlanMut.isPending}
                className="min-w-0 flex-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-initial sm:px-4 sm:text-sm"
              >
                {updatePlanMut.isPending ? 'Saving…' : 'Save plan'}
              </button>
              <button
                type="button"
                aria-label="Load a saved allocation plan"
                onClick={() => setLoadModalOpen(true)}
                className="min-w-0 flex-1 rounded-xl border-2 border-teal-500 bg-white px-3 py-2 text-xs font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-initial sm:px-4 sm:text-sm"
              >
                Load
              </button>
            </div>
            {activePlan ? (
              <>
                <div className="hidden h-7 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
                <button
                  type="button"
                  onClick={() => setAddDestinationModalOpen(true)}
                  aria-label="Choose what to add"
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:gap-2 sm:px-2.5 sm:text-sm"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800 shadow-inner sm:h-9 sm:w-9"
                    aria-hidden
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="sm:h-[18px] sm:w-[18px]">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="hidden min-[400px]:inline">Add</span>
                </button>
              </>
            ) : null}
            <div className="hidden h-7 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
            <button
              type="button"
              onClick={() => openDocs()}
              aria-label="Open budget allocation guide"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:gap-2 sm:px-2.5 sm:text-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-inner sm:h-9 sm:w-9"
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="translate-y-[0.5px] sm:h-[18px] sm:w-[18px]">
                  <path
                    d="M8 3.25h9.75a2.25 2.25 0 012.25 2.25V18a3 3 0 01-3 3h-9A3 3 0 016 18v-13a3 3 0 013-1.75z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M8 8.25h8M8 12h8M8 15.75h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="hidden min-[400px]:inline">Docs</span>
            </button>
          </div>
        </div>

        {loadModalOpen && (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-load-plan-title"
            onClick={e => {
              if (e.target === e.currentTarget) setLoadModalOpen(false)
            }}
          >
            <div
              className="flex max-h-[min(70vh,28rem)] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 id="budget-load-plan-title" className="text-lg font-semibold text-slate-800">
                  Load saved plan
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setLoadModalOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <span aria-hidden className="text-xl leading-none">
                    ×
                  </span>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {allPlansQuery.isLoading && (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">Loading plans…</p>
                )}
                {allPlansQuery.isError && (
                  <p className="px-3 py-4 text-center text-sm text-red-700" role="alert">
                    Could not load plans.{' '}
                    {allPlansQuery.error instanceof Error ? allPlansQuery.error.message : 'Unknown error'}
                  </p>
                )}
                {!allPlansQuery.isLoading &&
                  !allPlansQuery.isError &&
                  (allPlansQuery.data?.items.length ?? 0) === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-slate-500">
                      No saved allocation plans yet. Create one from the Budget page or run a database seed.
                    </p>
                  )}
                {!allPlansQuery.isLoading &&
                  !allPlansQuery.isError &&
                  (allPlansQuery.data?.items ?? []).length > 0 && (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {(allPlansQuery.data?.items ?? []).map(plan => (
                        <li key={plan.id}>
                          <button
                            type="button"
                            onClick={() => handleLoadSavedPlan(plan)}
                            className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition hover:bg-teal-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-slate-800">{plan.name}</span>
                              <span className="mt-0.5 block text-[11px] text-slate-400">
                                Plan #{plan.id} · {plan.currency}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-medium tabular-nums text-slate-600">
                              {formatPlanPeriodLabel(plan.period_month)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Opens that plan and jumps to its calendar month. Your lines and cash-flow map update automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {addDestinationModalOpen && (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-add-destination-title"
            onClick={e => {
              if (e.target === e.currentTarget) setAddDestinationModalOpen(false)
            }}
          >
            <div
              className="flex w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 id="budget-add-destination-title" className="text-lg font-semibold text-slate-800">
                  Add to this plan
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setAddDestinationModalOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <span aria-hidden className="text-xl leading-none">
                    ×
                  </span>
                </button>
              </div>
              <div className="px-4 py-4 space-y-2">
                <button
                  type="button"
                  onClick={goToAddAllocationLine}
                  className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <span className="text-sm font-semibold text-slate-800">Allocation line</span>
                  <span className="text-[11px] text-slate-500">
                    Opens the add form at the bottom of the allocation lines table.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={goToAddSavedCategory}
                  className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <span className="text-sm font-semibold text-slate-800">Saved category</span>
                  <span className="text-[11px] text-slate-500">
                    Opens the add panel at the bottom of the Categories section.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={goToAddAccount}
                  className="flex w-full flex-col items-start gap-0.5 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <span className="text-sm font-semibold text-slate-800">Cash flow account</span>
                  <span className="text-[11px] text-slate-500">
                    Opens the add form at the bottom of the Accounts list in the cash flow map.
                  </span>
                </button>
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  The page scrolls to the matching section and expands the add controls so you can enter fields right away.
                </p>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body,
    )}
    </>
  )
}
