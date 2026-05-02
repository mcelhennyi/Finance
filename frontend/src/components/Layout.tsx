import type { ReactNode } from 'react'

import { useOptionalBbdDocs } from './bbd/BbdDocsContext'

export type AppPage = 'dashboard' | 'parameters' | 'unified' | 'bbd'

interface Props {
  dateRange?: string
  children: ReactNode
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export function Layout({ dateRange, children, activePage = 'dashboard', onNavigate }: Props) {
  const docs = useOptionalBbdDocs()
  const brandClass = 'flex items-center gap-2.5 shrink-0'
  const brandMark = (
    <>
      <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg" width={36} height={36} />
      <span className="text-lg font-bold text-teal-600 tracking-tight">
        Finance <span className="text-slate-400 font-normal">Hub</span>
      </span>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-6">
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`${brandClass} rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`}
              aria-label="Finance Hub, go to dashboard"
            >
              {brandMark}
            </button>
          ) : (
            <div className={brandClass}>
              {brandMark}
            </div>
          )}
          {onNavigate && (
            <nav className="flex items-center gap-1 text-sm">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'dashboard'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onNavigate('unified')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'unified'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Unified view
              </button>
              <button
                type="button"
                onClick={() => onNavigate('parameters')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'parameters'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Parameters
              </button>
              <button
                type="button"
                onClick={() => onNavigate('bbd')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'bbd'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                BBD
              </button>
            </nav>
          )}
          {dateRange && (
            <span className="ml-auto text-xs text-slate-400">{dateRange}</span>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 space-y-5">
        {children}
      </main>

      {docs ? (
        <button
          type="button"
          onClick={() => docs.openDocs()}
          className="fixed z-[100] flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white py-3 pl-3.5 pr-4 shadow-lg shadow-slate-900/12 ring-slate-900/5 transition hover:border-teal-200 hover:bg-teal-50/80 hover:shadow-xl hover:shadow-teal-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          style={{
            bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
            right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
          }}
          aria-label="Open Buy Borrow Die projection guide"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-inner"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="translate-y-[0.5px]">
              <path
                d="M8 3.25h9.75a2.25 2.25 0 012.25 2.25V18a3 3 0 01-3 3h-9A3 3 0 016 18v-13a3 3 0 013-1.75z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M8 8.25h8M8 12h8M8 15.75h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="hidden min-[380px]:inline text-sm font-semibold tracking-tight text-slate-800">
            BBD docs
          </span>
        </button>
      ) : null}
    </div>
  )
}
