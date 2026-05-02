/** DOM ids used by the BBD guide modal for deep links (“Understand outcomes ›”). */

export const BBD_DOC_SECTION_IDS = {
  intro: 'bbd-docs-intro',
  timing: 'bbd-docs-timing',
  income: 'bbd-docs-income',
  expenses: 'bbd-docs-expenses',
  savings: 'bbd-docs-savings',
  taxes: 'bbd-docs-taxes',
  borrowing: 'bbd-docs-borrowing',
  strategy: 'bbd-docs-strategy',
  properties: 'bbd-docs-properties',
  privateEquity: 'bbd-docs-private-equity',
  engine: 'bbd-docs-engine',
  workflow: 'bbd-docs-workflow',
  monteCarlo: 'bbd-docs-monte-carlo',
  outputs: 'bbd-docs-outputs',
  limitations: 'bbd-docs-limitations',
} as const

export type BbdDocsSection = keyof typeof BBD_DOC_SECTION_IDS

export function bbdDocsScrollStorageKey(version = 'v2') {
  return `finance-hub-bbd-docs-scroll:${version}`
}
