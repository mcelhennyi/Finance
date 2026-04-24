import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MerchantNameRow } from '../types'

function MerchantTable({
  title,
  subtitle,
  rows,
  drafts,
  onDraft,
  onSave,
  onClear,
  savingKey,
  emptyMessage,
}: {
  title: string
  subtitle?: string
  rows: MerchantNameRow[]
  drafts: Record<string, string>
  onDraft: (key: string, value: string) => void
  onSave: (row: MerchantNameRow) => void
  onClear: (key: string) => void
  savingKey: string | null
  emptyMessage?: string
}) {
  if (!rows.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center text-slate-400 text-sm">
        {emptyMessage ?? 'No rows.'}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 min-w-[12rem]">Stored name</th>
              <th className="px-4 py-3 whitespace-nowrap">Txns</th>
              <th className="px-4 py-3 min-w-[8rem]">Auto pretty</th>
              <th className="px-4 py-3 min-w-[11rem]">Hand-written display</th>
              <th className="px-4 py-3 min-w-[8rem]">Shown as</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const inputVal =
                drafts[row.merchant_key] ??
                row.override_display ??
                row.auto_pretty
              return (
                <tr key={row.merchant_key} className="border-b border-slate-50 hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-2.5 text-slate-700 font-mono text-xs break-all max-w-md">
                    {row.merchant_key}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 tabular-nums whitespace-nowrap">
                    {row.transaction_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{row.auto_pretty || '—'}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={e => onDraft(row.merchant_key, e.target.value)}
                      className="w-full min-w-[10rem] rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Pretty name"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-teal-800 font-medium">
                    {(inputVal || '').trim() || row.merchant_key}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => onSave(row)}
                      disabled={savingKey === row.merchant_key}
                      className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg px-3 py-1.5"
                    >
                      {savingKey === row.merchant_key ? 'Saving…' : 'Save'}
                    </button>
                    {row.override_display && (
                      <button
                        type="button"
                        onClick={() => onClear(row.merchant_key)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ParametersPage() {
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [seedSyncWarning, setSeedSyncWarning] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['merchant-names'],
    queryFn: () => api.merchantNames(),
  })

  const putMut = useMutation({
    mutationFn: ({ merchant_key, display_name }: { merchant_key: string; display_name: string }) =>
      api.putMerchantDisplay(merchant_key, display_name),
    onSuccess: (data, vars) => {
      setSeedSyncWarning(
        data.seed_file_synced ? null : (data.seed_file_error ?? 'Could not update seed file on disk.'),
      )
      setDrafts(d => {
        const next = { ...d }
        delete next[vars.merchant_key]
        return next
      })
      void queryClient.invalidateQueries({ queryKey: ['merchant-names'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const delMut = useMutation({
    mutationFn: (merchant_key: string) => api.deleteMerchantDisplayOverride(merchant_key),
    onSuccess: data => {
      setSeedSyncWarning(
        data.seed_file_synced ? null : (data.seed_file_error ?? 'Could not update seed file on disk.'),
      )
      setDrafts(d => {
        const next = { ...d }
        delete next[data.merchant_key]
        return next
      })
      void queryClient.invalidateQueries({ queryKey: ['merchant-names'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const rows = q.data?.rows ?? []
  const outstanding = useMemo(() => rows.filter(r => r.needs_review), [rows])
  const sortedAll = useMemo(
    () => [...rows].sort((a, b) => b.transaction_count - a.transaction_count),
    [rows],
  )

  const onDraft = (key: string, value: string) => {
    setDrafts(d => ({ ...d, [key]: value }))
  }

  const handleSave = async (row: MerchantNameRow) => {
    const name =
      (drafts[row.merchant_key] ?? row.override_display ?? row.auto_pretty).trim()
    if (!name) return
    setSavingKey(row.merchant_key)
    try {
      await putMut.mutateAsync({ merchant_key: row.merchant_key, display_name: name })
    } finally {
      setSavingKey(null)
    }
  }

  const handleClear = async (merchant_key: string) => {
    setSavingKey(merchant_key)
    try {
      await delMut.mutateAsync(merchant_key)
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Parameters</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Each row is a distinct stored merchant string from your transactions. Auto pretty is generated locally;
          set a hand-written display name to lock how it appears in the transaction list. Outstanding rows are
          likely to need a custom label. Saving or clearing rewrites{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">data/seed-merchant-displays.json</code> so your
          mappings stay in sync with git-tracked seed data.
        </p>
      </div>

      {seedSyncWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
          <strong className="font-semibold">Seed file not updated.</strong>{' '}
          Your change is saved in the database. Fix the issue below, then save again to retry writing the file.{' '}
          <span className="opacity-90">{seedSyncWarning}</span>
        </div>
      )}

      {(putMut.error || delMut.error) && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
          {(putMut.error as Error)?.message ?? (delMut.error as Error)?.message}
        </div>
      )}

      {q.isLoading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Loading merchant names…</div>
      ) : q.isError ? (
        <div className="py-20 text-center text-red-600 text-sm">{(q.error as Error).message}</div>
      ) : (
        <>
          <MerchantTable
            title="Outstanding — needs a hand-written pretty name"
            subtitle={`${outstanding.length} name${outstanding.length === 1 ? '' : 's'} flagged by heuristics (no override yet).`}
            rows={outstanding}
            drafts={drafts}
            onDraft={onDraft}
            onSave={handleSave}
            onClear={handleClear}
            savingKey={savingKey}
            emptyMessage={
              sortedAll.length
                ? 'No outstanding rows — heuristics did not flag any merchants without an override.'
                : 'No merchant strings yet. Ingest a statement to populate this list.'
            }
          />

          <MerchantTable
            title="All merchant names"
            subtitle="Complete list sorted by transaction count."
            rows={sortedAll}
            drafts={drafts}
            onDraft={onDraft}
            onSave={handleSave}
            onClear={handleClear}
            savingKey={savingKey}
            emptyMessage="No non-empty merchant values in the database yet."
          />
        </>
      )}
    </div>
  )
}
