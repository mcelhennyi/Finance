/**
 * Budget allocation UI helpers (T-FR-0002-04).
 *
 * See Also: tasks/feature-history/FR-0002-budget-entry-page/tickets.md
 */

export const ALLOCATION_ITEM_CADENCES = [
  'weekly',
  'biweekly',
  'twice_monthly',
  'monthly',
  'quarterly',
  'yearly',
] as const

export type AllocationItemCadence = (typeof ALLOCATION_ITEM_CADENCES)[number]

export const PLAN_INCOME_CADENCES = [
  'weekly',
  'biweekly',
  'twice_monthly',
  'monthly',
  'yearly',
] as const

export type PlanIncomeCadence = (typeof PLAN_INCOME_CADENCES)[number]

export const PAYMENT_METHODS = ['cash', 'credit'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Table / KPI shorthand for the account implied by each payment method. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Checking',
  credit: 'Credit card',
}

/** Cash-flow graph node ref tied to each payment method (must exist in the plan graph). */
export function graphNodeRefForPaymentMethod(pm: PaymentMethod): string {
  return pm === 'credit' ? 'ian_chase_sapphire' : 'checking'
}

export function formatUsd(n: number): string {
  const sign = n < 0 ? '−' : ''
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Parse user-entered amount; returns null if invalid or non-positive. */
export function parsePositiveAmount(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** Due day for API: 1–31, or undefined when empty / invalid. */
export function dueDayFromInput(raw: string): number | undefined {
  const t = raw.trim()
  if (!t) return undefined
  const n = Number(t)
  if (!Number.isInteger(n) || n < 1 || n > 31) return undefined
  return n
}

export interface ItemDraftInput {
  item_name: string
  category: string
  planned_amount: string
  cadence: AllocationItemCadence
  payment_method: PaymentMethod
  due_day: string
  notes: string
}

export function validateItemDraft(d: ItemDraftInput): string | null {
  if (!d.item_name.trim()) return 'Item name is required.'
  if (!d.category.trim()) return 'Category is required.'
  if (parsePositiveAmount(d.planned_amount) == null) return 'Planned amount must be a positive number.'
  const dd = d.due_day.trim()
  if (dd) {
    const n = Number(dd)
    if (!Number.isInteger(n) || n < 1 || n > 31) return 'Due day must be between 1 and 31, or blank.'
  }
  return null
}

/** JSON body for POST item APIs (omits undefined due_day). */
export function allocationItemCreateBody(d: ItemDraftInput): Record<string, unknown> {
  const amt = parsePositiveAmount(d.planned_amount)
  if (amt == null) throw new Error('Invalid planned amount')
  const body: Record<string, unknown> = {
    item_name: d.item_name.trim(),
    category: d.category.trim(),
    planned_amount: String(amt),
    cadence: d.cadence,
    payment_method: d.payment_method,
    notes: d.notes.trim(),
    sort_order: 0,
  }
  const due = dueDayFromInput(d.due_day)
  if (due !== undefined) body.due_day = due
  return body
}

/** JSON body for PUT item (omit sort_order). */
export function allocationItemPutBody(d: ItemDraftInput): Record<string, unknown> {
  const err = validateItemDraft(d)
  if (err) throw new Error(err)
  const body = allocationItemCreateBody(d)
  const { sort_order: _s, ...rest } = body
  return rest
}

export function allocationItemUpdateBody(
  d: Partial<ItemDraftInput> & { planned_amount?: string }
): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (d.item_name !== undefined) body.item_name = d.item_name.trim()
  if (d.category !== undefined) body.category = d.category.trim()
  if (d.planned_amount !== undefined) {
    const amt = parsePositiveAmount(d.planned_amount)
    if (amt == null) throw new Error('Invalid planned amount')
    body.planned_amount = String(amt)
  }
  if (d.cadence !== undefined) body.cadence = d.cadence
  if (d.payment_method !== undefined) body.payment_method = d.payment_method
  if (d.notes !== undefined) body.notes = d.notes.trim()
  if (d.due_day !== undefined) {
    const t = d.due_day.trim()
    if (!t) body.due_day = null
    else {
      const due = dueDayFromInput(d.due_day)
      if (due === undefined) throw new Error('Invalid due day')
      body.due_day = due
    }
  }
  return body
}
