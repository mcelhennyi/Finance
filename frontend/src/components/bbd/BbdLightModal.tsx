import type { MouseEvent, ReactNode, RefObject } from 'react'
import { useEffect, useId, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  /** Ref for initial focus (e.g. first input). */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Wider / taller shell for JSON editor. */
  variant?: 'default' | 'wide'
}

/**
 * Compact centered dialog for BBD dock actions — lighter than the full-page guide modal.
 */
export function BbdLightModal(props: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const titleId = `${autoId}-title`

  useEffect(() => {
    if (!props.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [props.open, props.onClose])

  useEffect(() => {
    if (!props.open) return
    const t = window.setTimeout(() => {
      const el = props.initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      el?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [props.open, props.initialFocusRef])

  if (!props.open) return null

  const shellClass =
    props.variant === 'wide'
      ? 'max-w-2xl max-h-[min(52rem,calc(100dvh-5rem))]'
      : 'max-w-lg max-h-[min(34rem,calc(100dvh-6rem))]'

  const onBackdropMouseDown = (e: MouseEvent) => {
    if (e.target === backdropRef.current) props.onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onMouseDown={onBackdropMouseDown}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[210] flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15 ${shellClass}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-base font-semibold text-slate-800">
              {props.title}
            </h2>
            {props.description ? (
              <p className="mt-1 text-xs leading-snug text-slate-500">{props.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
          {props.children}
        </div>
      </div>
    </div>
  )
}
