import type { ReactNode } from 'react'

/**
 * Hover popovers for inline help — single opaque bubble; no native `title` stacking.
 */

export type OutputHoverPlacement = 'above' | 'below'

export function OutputHoverTip(props: {
  tip: string
  children: ReactNode
  /** Hint underline on triggers; omit for crowded forms. */
  dashed?: boolean
  className?: string
  /** `below`: opens under trigger (narrow headers / clipped tops). Default opens above. */
  placement?: OutputHoverPlacement
}) {
  const dashed = props.dashed !== false
  const baseBubble =
    'pointer-events-none absolute left-1/2 z-[280] w-max max-w-[min(22rem,calc(100vw-3rem))] -translate-x-1/2 overflow-y-auto rounded-md bg-slate-950 px-3 py-2 text-left text-[10px] font-normal normal-case whitespace-normal leading-snug text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-none group-hover:opacity-100'
  const bubbleCls =
    props.placement === 'below'
      ? `${baseBubble} top-full mt-2`
      : `${baseBubble} bottom-full mb-2`

  return (
    <span className={`group relative inline-flex max-w-full cursor-default ${props.className ?? ''}`}>
      <span className={dashed ? 'border-b border-dotted border-slate-400' : undefined}>{props.children}</span>
      <span className={bubbleCls}>{props.tip}</span>
    </span>
  )
}
