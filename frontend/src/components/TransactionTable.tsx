import { useState } from 'react'
import type { Transaction } from '../types'

interface Props {
  transactions: Transaction[] | undefined
  loading: boolean
}

const PAGE_SIZE = 50

function usd(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function TransactionTable({ transactions, loading }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const rows = (transactions ?? []).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.source_type.toLowerCase().includes(q) ||
      (t.merchant_display && t.merchant_display.toLowerCase().includes(q)) ||
      (t.merchant && t.merchant.toLowerCase().includes(q)) ||
      String(t.amount).includes(q)
    )
  })

  const pageCount = Math.ceil(rows.length / PAGE_SIZE)
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          All Transactions
          {transactions && (
            <span className="ml-2 normal-case text-slate-400">
              ({rows.length.toLocaleString()} of {transactions.length.toLocaleString()})
            </span>
          )}
        </h2>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse">Loading…</div>
        ) : !visible.length ? (
          <div className="py-16 text-center text-slate-400">
            <div className="text-2xl mb-2">💳</div>
            {transactions?.length
              ? 'No transactions match your search.'
              : 'Upload a statement to get started.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Bank</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5 text-slate-500 tabular-nums whitespace-nowrap">{t.date}</td>
                  <td className="px-5 py-2.5 text-slate-700 max-w-xs truncate">{t.description}</td>
                  <td className="px-5 py-2.5 text-slate-600 max-w-[10rem] truncate text-xs" title={t.merchant || undefined}>
                    {t.merchant_display || t.merchant || '—'}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="inline-block rounded-full bg-teal-50 text-teal-700 px-2.5 py-0.5 text-[11px] font-semibold">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-5 py-2.5 text-right tabular-nums font-medium whitespace-nowrap ${
                    t.is_credit ? 'text-green-600' : 'text-slate-800'
                  }`}>
                    {t.is_credit ? '-' : ''}{usd(t.amount)}
                  </td>
                  <td className="px-5 py-2.5 text-slate-400 text-xs">{t.source_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span>Page {page + 1} of {pageCount}</span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="px-3 py-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
