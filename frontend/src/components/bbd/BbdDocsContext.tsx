import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import { BbdGuideContent } from './BbdGuideContent'
import { BBD_DOC_SECTION_IDS, bbdDocsScrollStorageKey, type BbdDocsSection } from './bbdDocAnchors'

const STORAGE = bbdDocsScrollStorageKey()

type PendingOpen = { mode: 'restore' } | { mode: 'section'; section: BbdDocsSection }

export type BbdDocsContextValue = {
  /** Open guide modal. Omit `section` to restore saved scroll position. */
  openDocs: (section?: BbdDocsSection) => void
}

const BbdDocsContext = createContext<BbdDocsContextValue | null>(null)

export function useOptionalBbdDocs(): BbdDocsContextValue | null {
  return useContext(BbdDocsContext)
}

export function useBbdDocs(): BbdDocsContextValue {
  const v = useContext(BbdDocsContext)
  if (!v) throw new Error('useBbdDocs requires BbdDocsProvider')
  return v
}

function readSavedScroll(): number {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw == null) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) ? Math.max(0, n) : 0
  } catch {
    return 0
  }
}

function writeSavedScroll(px: number) {
  try {
    localStorage.setItem(STORAGE, String(Math.max(0, Math.round(px))))
  } catch {
    /* ignore quota / private mode */
  }
}

export function BbdDocsSectionLink(props: {
  section: BbdDocsSection
  className?: string
  /** Override default “Understand outcomes ›” copy. */
  label?: string
}) {
  const { openDocs } = useBbdDocs()
  const cls =
    props.className ??
    'inline-flex shrink-0 text-[10px] font-semibold uppercase tracking-wide text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2'

  const onActivate = () => openDocs(props.section)

  return (
    <button
      type="button"
      className={cls}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation()
        onActivate()
      }}
    >
      {props.label ?? 'Understand outcomes ›'}
    </button>
  )
}

function Modal(props: {
  pendingOpen: PendingOpen
  openGeneration: number
  onDismiss: () => void
}) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const closeAndPersistScroll = () => {
    const el = scrollRef.current
    if (el) writeSavedScroll(el.scrollTop)
    props.onDismiss()
  }

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    requestAnimationFrame(() => {
      if (props.pendingOpen.mode === 'section') {
        const domId = BBD_DOC_SECTION_IDS[props.pendingOpen.section]
        document.getElementById(domId)?.scrollIntoView({ behavior: 'auto', block: 'start' })
        return
      }
      scrollEl.scrollTop = readSavedScroll()
    })
  }, [props.pendingOpen, props.openGeneration])

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeAndPersistScroll()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close persists scroll intentionally
  }, [])

  const backdropMouseDown = (e: ReactMouseEvent) => {
    if (e.target === backdropRef.current) closeAndPersistScroll()
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex justify-center overflow-y-auto sm:overflow-y-visible sm:p-6"
      aria-modal="true"
      aria-labelledby="bbd-docs-modal-title"
      role="dialog"
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 min-h-full bg-slate-900/55 backdrop-blur-[1px]"
        onMouseDown={backdropMouseDown}
        aria-hidden="true"
      />
      <div
        className="relative z-[410] mx-0 mb-auto mt-0 flex min-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden border-x border-white/10 bg-white shadow-2xl sm:mt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:min-h-0 sm:max-h-[min(42rem,calc(100dvh-2rem))] sm:rounded-2xl sm:border sm:border-slate-200"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="bbd-docs-modal-title" className="text-lg font-semibold text-slate-800">
              Buy · Borrow · Die guide
            </h2>
            <p className="mt-1 max-w-xl text-[11px] leading-snug text-slate-500">
              Your scroll position is restored when you close and reopen from the floating docs button or “Open full BBD
              guide”. Contextual links skip restore and jump to the matching topic.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndPersistScroll}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Close
          </button>
        </div>
        <div
          className="min-h-0 flex-1 outline-none sm:flex sm:flex-col"
          onKeyDown={(e: ReactKeyboardEvent) => {
            if (e.key === 'Escape') closeAndPersistScroll()
          }}
        >
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
            tabIndex={-1}
          >
            <BbdGuideContent />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BbdDocsProvider(props: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState<PendingOpen>({ mode: 'restore' })
  const [openGeneration, bumpOpenGeneration] = useReducer((n: number) => n + 1, 0)

  const openDocs = useCallback((section?: BbdDocsSection) => {
    setPendingOpen(section ? { mode: 'section', section } : { mode: 'restore' })
    bumpOpenGeneration()
    setOpen(true)
  }, [])

  const dismiss = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openDocs }), [openDocs])

  return (
    <BbdDocsContext.Provider value={value}>
      {props.children}
      {open ? (
        <Modal pendingOpen={pendingOpen} openGeneration={openGeneration} onDismiss={dismiss} />
      ) : null}
    </BbdDocsContext.Provider>
  )
}
