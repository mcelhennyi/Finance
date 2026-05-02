/** Narrow inputs for BBD scenario: currency grouping and %-of-100 UX; state stays API decimals. */

import { useCallback, useEffect, useState } from 'react'

import { OutputHoverTip } from '../OutputHoverTip'

const usdFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function parseUsdTyping(s: string): number | null {
  const t = s.replace(/,/g, '').trim()
  if (t === '' || t === '-' || t === '.' || t === '-.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function pctPointsDisplay(decimal: number, displayDecimals: number): number | string {
  if (!Number.isFinite(decimal)) return ''
  const v = decimal * 100
  const fac = Math.pow(10, displayDecimals)
  return Math.round(v * fac) / fac
}

/** Muted caption under a control — spells out nominal USD cadence vs % semantics. */

export function UnitCaption(props: { text: string }) {
  return (
    <p className="mt-1 max-w-[min(18rem,calc(100vw-4rem))] text-[10px] leading-snug text-slate-400 normal-case font-normal tracking-normal">
      {props.text}
    </p>
  )
}

export function FormFieldLabel(props: { label: string; tip?: string }) {
  const cls = 'text-[11px] font-semibold uppercase tracking-wide text-slate-400'
  if (!props.tip) return <span className={cls}>{props.label}</span>
  return (
    <OutputHoverTip tip={props.tip} dashed={false} placement="below" className={cls}>
      {props.label}
    </OutputHoverTip>
  )
}

export function MoneyField(props: {
  label: string
  value: number
  hint?: string
  /** Long hover explanation matched to backend field semantics. */
  tip?: string
  /** Plain-language cadence / basis (shown under the inputs). */
  unit?: string
  onCommit: (n: number) => void
}) {
  const { label, value, hint, tip, unit, onCommit } = props
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  const syncFromProp = useCallback(() => usdFmt.format(Number.isFinite(value) ? value : 0), [value])

  useEffect(() => {
    if (focused) return
    setText(syncFromProp())
  }, [focused, syncFromProp])

  return (
    <label className="block min-w-0">
      <FormFieldLabel label={label} tip={tip} />
      {hint ? (
        <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">{hint}</span>
      ) : null}
      <div className="flex items-center gap-0.5 mt-0.5">
        <span className="text-slate-400 text-xs shrink-0 select-none">$</span>
        <input
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          value={text}
          onFocus={() => {
            setFocused(true)
            setText(t => t.replace(/,/g, ''))
          }}
          onChange={e => setText(e.target.value.replace(/[^0-9.,-]/g, ''))}
          onBlur={() => {
            const parsed = parseUsdTyping(text)
            setFocused(false)
            onCommit(parsed !== null ? parsed : value)
          }}
          className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>
      {unit ? <UnitCaption text={unit} /> : null}
    </label>
  )
}

export function PctField(props: {
  label: string
  value: number
  hint?: string
  tip?: string
  /** Display rounding for percentage points (API still uses decimals). */
  displayDecimals?: number
  step?: string
  /** Plain-language explanation of what % applies to. */
  unit?: string
  onCommit: (n: number) => void
}) {
  const {
    label,
    value,
    hint,
    tip,
    displayDecimals = 4,
    step = 'any',
    unit,
    onCommit,
  } = props

  const display = pctPointsDisplay(value, displayDecimals)

  return (
    <label className="block min-w-0">
      <FormFieldLabel label={label} tip={tip} />
      {hint ? (
        <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">{hint}</span>
      ) : null}
      <div className="flex items-center gap-0.5 mt-0.5">
        <input
          type="number"
          step={step}
          value={display === '' ? '' : display}
          onChange={e => {
            const raw = e.target.value
            if (raw === '' || raw === '-') {
              return
            }
            const pct = Number(raw)
            if (Number.isNaN(pct)) return
            onCommit(pct / 100)
          }}
          className="flex-1 min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        <span className="text-slate-400 text-xs shrink-0 select-none">%</span>
      </div>
      {unit ? <UnitCaption text={unit} /> : null}
    </label>
  )
}
