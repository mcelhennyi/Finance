import { useState } from 'react'

import { GeneralSettingsOverview } from './settings/GeneralSettingsOverview'
import { MerchantNamesSettings } from './settings/MerchantNamesSettings'
import { SettingsNavTree } from './settings/SettingsNavTree'
import { DEFAULT_SETTINGS_NAV_ID, type SettingsNavId } from './settings/navTree'

export function SettingsPage() {
  const [activeId, setActiveId] = useState<SettingsNavId>(DEFAULT_SETTINGS_NAV_ID)
  const [merchantDrafts, setMerchantDrafts] = useState<Record<string, string>>({})

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
      <aside className="w-full md:w-56 lg:w-60 shrink-0 md:sticky md:top-[4.5rem] md:max-h-[calc(100vh-5.5rem)] md:overflow-y-auto pb-2 md:pr-2 md:border-r md:border-slate-200">
        <SettingsNavTree activeId={activeId} onSelect={setActiveId} />
      </aside>

      <div className="flex-1 min-w-0 space-y-6 w-full">
        {activeId === 'general-overview' ? <GeneralSettingsOverview /> : null}
        {activeId === 'merchants-outstanding' ? (
          <MerchantNamesSettings mode="outstanding" drafts={merchantDrafts} setDrafts={setMerchantDrafts} />
        ) : null}
        {activeId === 'merchants-all' ? (
          <MerchantNamesSettings mode="all" drafts={merchantDrafts} setDrafts={setMerchantDrafts} />
        ) : null}
      </div>
    </div>
  )
}
