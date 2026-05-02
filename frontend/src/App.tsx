import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api/client'
import { Layout, type AppPage } from './components/Layout'
import { UploadZone } from './components/UploadZone'
import { FilterBar } from './components/FilterBar'
import { StatCards } from './components/StatCards'
import { Charts } from './components/Charts'
import { TransactionTable } from './components/TransactionTable'
import { ParametersPage } from './pages/ParametersPage'
import { UnifiedViewPage } from './pages/UnifiedViewPage'
import { BbdProjectionPage } from './pages/BbdProjectionPage'
import type { FilterState } from './types'

const DEFAULT_FILTER: FilterState = { from: '', to: '', category: '', source: '' }

export function App() {
  const [page, setPage] = useState<AppPage>('dashboard')
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTER)
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTER)

  const metricsQuery = useQuery({
    queryKey: ['metrics', applied],
    queryFn: () => api.metrics(applied),
  })

  const txQuery = useQuery({
    queryKey: ['transactions', applied],
    queryFn: () => api.transactions(applied),
  })

  const handleApply = () => setApplied({ ...pending })
  const handleReset = () => { setPending(DEFAULT_FILTER); setApplied(DEFAULT_FILTER) }

  const handleApplyDateRange = (from: string, to: string) => {
    const next = { ...pending, from, to }
    setPending(next)
    setApplied(next)
  }

  const handleClearDates = () => {
    const next = { ...pending, from: '', to: '' }
    setPending(next)
    setApplied(next)
  }

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {page === 'parameters' ? (
        <ParametersPage />
      ) : page === 'unified' ? (
        <UnifiedViewPage />
      ) : page === 'bbd' ? (
        <BbdProjectionPage />
      ) : (
        <div className="space-y-6">
          <UploadZone />

          <FilterBar
            filter={pending}
            onChange={setPending}
            onApply={handleApply}
            onReset={handleReset}
            onApplyDateRange={handleApplyDateRange}
            onClearDates={handleClearDates}
          />

          <StatCards metrics={metricsQuery.data} loading={metricsQuery.isLoading} />

          <Charts metrics={metricsQuery.data} loading={metricsQuery.isLoading} />

          <TransactionTable transactions={txQuery.data} loading={txQuery.isLoading} />
        </div>
      )}
    </Layout>
  )
}
