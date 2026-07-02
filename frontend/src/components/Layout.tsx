import type { ReactNode } from 'react'

export type AppPage = 'dashboard' | 'settings' | 'unified' | 'budget' | 'bbd'

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
      <span className="hidden text-lg font-bold text-teal-600 tracking-tight min-[430px]:inline">
        Finance <span className="text-slate-400 font-normal">Hub</span>
      </span>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex h-14 w-full min-w-0 items-center gap-2 px-3 sm:gap-6 sm:px-6">
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
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
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
                onClick={() => onNavigate('budget')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'budget'
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Budget
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
          {(onNavigate || dateRange) && (
            <div className="flex shrink-0 items-center gap-3">
              {dateRange && <span className="text-xs text-slate-400">{dateRange}</span>}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                    activePage === 'settings'
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                  aria-label="Settings"
                  title="Settings"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0"
                    aria-hidden
                  >
                    <path
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 space-y-5">
        {children}
      </main>
    </div>
  )
}
