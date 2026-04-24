import type { ReactNode } from 'react'

export type AppPage = 'dashboard' | 'parameters'

interface Props {
  dateRange?: string
  children: ReactNode
  activePage?: AppPage
  onNavigate?: (page: AppPage) => void
}

export function Layout({ dateRange, children, activePage = 'dashboard', onNavigate }: Props) {
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
                onClick={() => onNavigate('parameters')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'parameters'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Parameters
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
    </div>
  )
}
