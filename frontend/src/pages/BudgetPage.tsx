import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { api } from '../api/client'
import {
  ALLOCATION_ITEM_CADENCES,
  PLAN_INCOME_CADENCES,
  PAYMENT_METHODS,
  allocationItemCreateBody,
  allocationItemPutBody,
  formatUsd,
  validateItemDraft,
  type AllocationItemCadence,
  type ItemDraftInput,
  type PaymentMethod,
  type PlanIncomeCadence,
} from '../lib/budgetAllocation'
import { firstOfMonthFromYm, thisMonthYm } from '../lib/monthRange'
import type { AllocationItem, AllocationPlan } from '../types'
import { BudgetDocsSectionLink, useBudgetDocs } from '../components/budget/BudgetDocsContext'
import { BUDGET_FIELD_TIPS } from '../components/budget/budgetFieldTips'
import { BUDGET_SCROLL_ANCHORS, type BudgetDocsSection } from '../components/budget/budgetDocAnchors'
import { CashFlowGraphPanel } from '../components/budget/CashFlowGraphPanel'
import { OutputHoverTip } from '../components/OutputHoverTip'

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
  const [ym, setYm] = useState(thisMonthYm)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [planNameDraft, setPlanNameDraft] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeCadence, setIncomeCadence] = useState<PlanIncomeCadence | ''>('')
  const [newItem, setNewItem] = useState<ItemDraftInput>(emptyDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ItemDraftInput | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['budgetPlans'] })
    queryClient.invalidateQueries({ queryKey: ['budgetItems'] })
    queryClient.invalidateQueries({ queryKey: ['budgetSummary'] })
    queryClient.invalidateQueries({ queryKey: ['budgetCashFlowGraph'] })
    queryClient.invalidateQueries({ queryKey: ['unifiedViewSummary'] })
  }

  const plansQuery = useQuery({
    queryKey: ['budgetPlans', monthIso],
    queryFn: () => api.listBudgetAllocationPlans(monthIso),
    enabled: Boolean(monthIso),
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
    onSuccess: () => {
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

  return (
    <div id={BUDGET_SCROLL_ANCHORS.top} className="space-y-8 pb-28">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Budget allocation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Plan recurring amounts by category for a month. Totals sync to the unified view as category budgets.
        </p>
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
        {plans.length > 1 && (
          <label className="flex flex-col gap-1 text-sm min-w-[12rem]">
            <FieldLabel tip={BUDGET_FIELD_TIPS.planSelect}>Plan</FieldLabel>
            <select
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
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <BudgetDocsSectionLink section="monthAndPlans" label="Months & plans ›" />
        <BudgetDocsSectionLink section="cashFlowMap" label="Cash flow visualization ›" />
        <BudgetDocsSectionLink section="unifiedSync" label="Unified view sync ›" />
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
                  label="Cash"
                  labelTip={BUDGET_FIELD_TIPS.kpi.cash}
                  value={formatUsd(summaryQuery.data.cash_allocated)}
                />
                <Kpi
                  label="Credit"
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
            <CashFlowGraphPanel planId={selectedPlanId} />
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
                        <OutputHoverTip tip={BUDGET_FIELD_TIPS.columns.pay} dashed={false} placement="below" className="inline font-semibold">
                          Pay
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
                          <td className="px-3 py-2">
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
                                  {c}
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
                          <td className="px-3 py-2 capitalize text-slate-600">{item.payment_method}</td>
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
                <p className="px-4 py-8 text-center text-sm text-slate-400">No lines yet. Add one below.</p>
              )}
            </div>

            <div id={BUDGET_SCROLL_ANCHORS.add} className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-700">Add line</h3>
                <BudgetDocsSectionLink section="addLine" label="Line fields ›" className="text-[10px]" />
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <input
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize"
                  value={newItem.payment_method}
                  onChange={e =>
                    setNewItem({ ...newItem, payment_method: e.target.value as PaymentMethod })
                  }
                >
                  {PAYMENT_METHODS.map(c => (
                    <option key={c} value={c}>
                      {c}
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
            deleteItemMut.error) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
              {[
                createPlanMut.error,
                updatePlanMut.error,
                deletePlanMut.error,
                createItemMut.error,
                updateItemMut.error,
                deleteItemMut.error,
              ]
                .filter(Boolean)
                .map(e => (e instanceof Error ? e.message : String(e)))
                .join(' ')}
            </div>
          )}
        </>
      )}

      <div
        className="fixed inset-x-0 z-[95] flex justify-center pointer-events-none px-2"
        style={{ bottom: barBottom }}
        role="region"
        aria-label="Budget page controls"
      >
        <div className="pointer-events-auto flex max-w-[min(56rem,calc(100vw-1rem))] flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-lg shadow-slate-900/15 backdrop-blur-sm ring-1 ring-slate-900/5 sm:gap-2 sm:px-3 sm:py-2.5">
          <button
            type="button"
            aria-label="Save plan name and income"
            onClick={handleSavePlanMeta}
            disabled={!activePlan || updatePlanMut.isPending}
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:px-4 sm:text-sm"
          >
            {updatePlanMut.isPending ? 'Saving…' : 'Save plan'}
          </button>
          <div className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden />
          <button
            type="button"
            onClick={() => openDocs()}
            aria-label="Open budget allocation guide"
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-2 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:gap-2 sm:px-2.5 sm:text-sm"
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
    </div>
  )
}
