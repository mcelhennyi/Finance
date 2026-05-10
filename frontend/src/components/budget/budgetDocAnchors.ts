/** Anchored sections for the in-app Budget allocation guide modal. */

export const BUDGET_DOC_SECTION_IDS = {
  intro: 'budget-docs-intro',
  monthAndPlans: 'budget-docs-month-plans',
  cashFlowMap: 'budget-docs-cash-flow-map',
  planDetails: 'budget-docs-plan-details',
  summary: 'budget-docs-summary',
  allocationLines: 'budget-docs-allocation-lines',
  addLine: 'budget-docs-add-line',
  unifiedSync: 'budget-docs-unified-sync',
} as const

export type BudgetDocsSection = keyof typeof BUDGET_DOC_SECTION_IDS

/** DOM ids for scroll targets (optional anchors for layout). */
export const BUDGET_SCROLL_ANCHORS = {
  top: 'budget-anchor-top',
  period: 'budget-anchor-period',
  plan: 'budget-anchor-plan',
  summary: 'budget-anchor-summary',
  cashFlowGraph: 'budget-anchor-cash-flow-graph',
  planMoneyFlows: 'budget-anchor-plan-money-flows',
  lines: 'budget-anchor-lines',
  add: 'budget-anchor-add',
  categories: 'budget-anchor-categories',
} as const

export function budgetDocsScrollStorageKey(version = 'v1'): string {
  return `finance-hub-budget-docs-scroll:${version}`
}
