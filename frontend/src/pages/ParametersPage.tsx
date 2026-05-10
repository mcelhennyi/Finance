import { useState } from 'react'

import { MerchantNamesSettings } from './settings/MerchantNamesSettings'

/**
 * Legacy entry: merchant display overrides were exposed on a standalone “Parameters” route.
 * The supported surface is **Settings → Transactions → Merchant display** (`SettingsPage`).
 *
 * This module remains so feature branches or docs that still import `ParametersPage` resolve
 * without breaking the Vite graph, and behavior stays aligned with `MerchantNamesSettings`.
 *
 * See Also: scripts/README.md (merchant display overrides), tasks/feature-history/FR-0004-bbd-projection-experience/handoffs/2026-05-09-pr-to-master.md
 */
export function ParametersPage() {
  const [merchantDrafts, setMerchantDrafts] = useState<Record<string, string>>({})

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <span className="font-semibold">Heads up:</span> merchant display overrides now live under the gear icon →{' '}
        <span className="font-medium">Settings</span> → <span className="font-medium">Transactions</span> →{' '}
        <span className="font-medium">Merchant display</span>. This page keeps the same editor for deep links or older
        imports.
      </div>
      <MerchantNamesSettings mode="outstanding" drafts={merchantDrafts} setDrafts={setMerchantDrafts} />
    </div>
  )
}
