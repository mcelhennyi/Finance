import type { ReactNode } from 'react'

interface Props {
  dateRange?: string
  children: ReactNode
}

export function Layout({ dateRange, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <span className="text-lg font-bold text-teal-600 tracking-tight">
            Finance <span className="text-slate-400 font-normal">Hub</span>
          </span>
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
