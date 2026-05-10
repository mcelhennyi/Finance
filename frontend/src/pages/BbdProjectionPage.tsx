import { useMutation } from '@tanstack/react-query'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../api/client'
import { BbdLightModal } from '../components/bbd/BbdLightModal'
import { BbdScenarioFields } from '../components/bbd/BbdScenarioFields'
import { BBD_PAGE_HELP } from '../components/bbd/bbdFieldTips'
import { BbdDocsSectionLink, useBbdDocs } from '../components/bbd/BbdDocsContext'
import { BbdStoryDashboard } from '../components/bbd/BbdStoryDashboard'
import { BBD_OUTPUT_TIPS } from '../components/bbd/bbdOutputTips'
import { OutputHoverTip } from '../components/OutputHoverTip'
import { buildBbdVizModel, sampleScheduleForTable } from '../lib/bbdVizModel'
import type { BbdPreset, BbdScenarioState } from '../lib/bbdScenario'
import {
  cloneScenario,
  createDefaultScenario,
  deletePresetById,
  hydrateScenarioFromApiShape,
  loadPresets,
  scenarioToApiPayload,
  savePresets,
  upsertPreset,
} from '../lib/bbdScenario'
import type { BbdRunPayload, BbdRunResponse, BbdScheduleRow } from '../types'

const BbdSpatialPanel = lazy(() => import('../components/bbd/BbdSpatialPanel'))

/** Alias for hover tips used on this page. */
const OUTPUT_TIPS = BBD_OUTPUT_TIPS

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

/** Year-over-year change in modeled USD. First simulated year passes null ⇒ em dash. */
function fmtUsdYoYDelta(delta: number | null | undefined) {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) return '—'
  if (delta === 0) return fmtUsd(0)
  if (delta > 0) return `+${fmtUsd(delta)}`
  return fmtUsd(delta)
}

type DockPanel = 'presets' | 'run' | 'advanced' | 'export' | null

/** Stable column order for CSV export (full schedule rows). */
const SCHEDULE_CSV_KEYS: (keyof BbdScheduleRow)[] = [
  'year',
  'age',
  'w2_income',
  'rental_net_cash_flow',
  'portfolio_dividends',
  'drawdown_borrowed',
  'taxes_paid',
  'living_expenses',
  'gross_cash_income',
  'taxes_delta_yoy',
  'gross_income_delta_yoy',
  'portfolio_value',
  'portfolio_basis',
  'portfolio_unrealized_gain',
  'properties_value',
  'properties_mortgage_balance',
  'pe_value',
  'pe_basis',
  'pe_exited_this_year',
  'sbloc_balance',
  'heloc_refi_balance',
  'total_assets',
  'total_liabilities',
  'net_worth',
  'sbloc_capacity_remaining',
  'sbloc_ltv',
  'margin_call',
  'sofr',
  'sbloc_rate',
]

function escapeCsvCell(raw: string): string {
  if (/[",\r\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

function scheduleCellCsv(row: BbdScheduleRow, key: keyof BbdScheduleRow): string {
  const v = row[key] as unknown
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  return String(v)
}

function scheduleToCsv(rows: BbdScheduleRow[]): string {
  const header = SCHEDULE_CSV_KEYS.map(k => escapeCsvCell(String(k))).join(',')
  const lines = [header]
  for (const row of rows) {
    lines.push(SCHEDULE_CSV_KEYS.map(k => escapeCsvCell(scheduleCellCsv(row, k))).join(','))
  }
  return lines.join('\n')
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  if (!ok) throw new Error('execCommand copy failed')
}

export function BbdProjectionPage() {
  const { openDocs } = useBbdDocs()
  const [scenario, setScenario] = useState<BbdScenarioState>(() => createDefaultScenario())
  const [presets, setPresets] = useState<BbdPreset[]>([])

  useEffect(() => {
    try {
      setPresets(loadPresets())
    } catch {
      setPresets([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const d = await api.bbdDefaultScenario()
        if (!cancelled) setScenario(hydrateScenarioFromApiShape(d.scenario))
      } catch {
        if (!cancelled) setScenario(createDefaultScenario())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => a.name.localeCompare(b.name)),
    [presets],
  )

  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetMsg, setPresetMsg] = useState<string | null>(null)
  const [mcTrials, setMcTrials] = useState('0')
  const [parseError, setParseError] = useState<string | null>(null)
  const [advancedDraft, setAdvancedDraft] = useState('')
  const [dockPanel, setDockPanel] = useState<DockPanel>(null)
  const [exportHint, setExportHint] = useState<string | null>(null)
  const resultsAnchorRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: (payload: BbdRunPayload) => api.bbdProjectionRun(payload),
  })

  const scheduleRows = mutation.data?.schedule ?? []
  const displayRows = useMemo(
    () => sampleScheduleForTable(scheduleRows, 5),
    [scheduleRows],
  )

  const refreshAdvancedJson = () => {
    setAdvancedDraft(JSON.stringify(scenarioToApiPayload(scenario), null, 2))
  }

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedDraft) as unknown
      setScenario(hydrateScenarioFromApiShape(parsed))
      setParseError(null)
      setPresetMsg('Merged Advanced JSON into the form.')
    } catch {
      setParseError('Advanced JSON is invalid — fix syntax or Refresh from form.')
      setPresetMsg(null)
    }
  }

  const loadPreset = () => {
    const p = presets.find(x => x.id === selectedPresetId)
    if (!p) {
      setPresetMsg('Choose a preset or save a new one first.')
      return
    }
    setScenario(cloneScenario(hydrateScenarioFromApiShape(p.scenario as unknown)))
    setParseError(null)
    setPresetMsg(`Loaded “${p.name}”.`)
  }

  const savePreset = () => {
    const n = presetName.trim()
    if (!n) {
      setPresetMsg('Enter a preset name.')
      return
    }
    const next = upsertPreset(presets, n, scenario)
    savePresets(next)
    setPresets(next)
    const fresh = next.find(x => x.name.toLowerCase() === n.toLowerCase())
    if (fresh) setSelectedPresetId(fresh.id)
    setPresetName('')
    setPresetMsg(`Saved “${n}” to this browser (localStorage).`)
  }

  const removePreset = () => {
    const id = selectedPresetId
    if (!id) {
      setPresetMsg('Select a preset to delete.')
      return
    }
    const next = deletePresetById(presets, id)
    savePresets(next)
    setPresets(next)
    setSelectedPresetId('')
    setPresetMsg('Preset deleted from this browser.')
  }

  const resetBuiltinScenario = () => {
    setParseError(null)
    void (async () => {
      try {
        const d = await api.bbdDefaultScenario()
        setScenario(hydrateScenarioFromApiShape(d.scenario))
        setPresetMsg('Reset to server seed scenario (YAML).')
      } catch {
        setScenario(createDefaultScenario())
        setPresetMsg('Offline starter template — seed API unreachable or missing file.')
      }
    })()
  }

  const buildRunPayload = (): { ok: true; payload: BbdRunPayload } | { ok: false } => {
    const trials = Number.parseInt(mcTrials, 10)
    if (Number.isNaN(trials) || trials < 0) return { ok: false }
    return {
      ok: true,
      payload: {
        scenario: scenarioToApiPayload(scenario),
        ...(trials === 0 ? {} : { monte_carlo_trials: trials, monte_carlo_seed: 42 }),
      },
    }
  }

  const runProjection = () => {
    setParseError(null)
    setPresetMsg(null)
    const built = buildRunPayload()
    if (!built.ok) {
      setParseError('Monte Carlo trials must be a non-negative integer.')
      return
    }
    mutation.mutate(built.payload)
  }

  useEffect(() => {
    if (dockPanel !== 'advanced') return
    refreshAdvancedJson()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when opening Advanced modal
  }, [dockPanel])

  const closeDock = useCallback(() => setDockPanel(null), [])

  const scrollToResults = useCallback(() => {
    const el = resultsAnchorRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      el.focus({ preventScroll: true })
    }, 400)
  }, [])

  const selectCls =
    'mt-1 min-w-[12rem] max-w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500'

  const inputCls =
    'mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

  const btnMuted =
    'rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40'

  const barBottom = 'max(0.75rem, env(safe-area-inset-bottom, 0px))'

  return (
    <div className="space-y-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <strong className="font-semibold">Disclaimer.</strong>{' '}
        This projection is illustrative and depends on simplifying assumptions about taxes,
        borrowing, securities, property, and private equity — not individualized advice. Outputs are
        not recommendations to buy or sell securities or real estate.
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Buy · Borrow · Die projection
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Use the structured form for common inputs — the POST body mirrors{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">/api/bbd-projection/run</code>.
            Starter fields hydrate from{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">
              GET /api/bbd-projection/default-scenario
            </code>{' '}
            (<code className="text-[11px] bg-slate-100 px-1 rounded">data/seed-statements/ian.yaml</code>
            ).{' '}
            <strong className="font-medium text-slate-700">Presets</strong>,{' '}
            <strong className="font-medium text-slate-700">Run &amp; Monte Carlo</strong>,{' '}
            <strong className="font-medium text-slate-700">Advanced JSON</strong>, and{' '}
            <strong className="font-medium text-slate-700">Export</strong> live in the bottom control bar (small
            panels). The full narrative guide opens separately.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Operator depth:{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">scripts/bbd-projection/README.md</code> (CLI cookbook + Strategy appendix). Example TOML:{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">scripts/bbd-projection/example-scenario.toml</code>.
          </p>
        </div>

        {(parseError || mutation.isError) && dockPanel !== 'run' && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">
            {parseError ??
              (mutation.error instanceof Error ? mutation.error.message : 'Request failed.')}
          </div>
        )}

        {mutation.isPending ? (
          <div className="rounded-lg border border-teal-100 bg-teal-50/80 text-teal-900 text-sm px-4 py-3">
            Running projection — you can keep editing; open <strong className="font-medium">Run</strong> in
            the bar below for status.
          </div>
        ) : null}

        <BbdScenarioFields scenario={scenario} setScenario={setScenario} />
      </section>

      <div
        id="bbd-results-anchor"
        ref={resultsAnchorRef}
        tabIndex={-1}
        className="space-y-6 scroll-mt-8 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2"
      >
        {mutation.data ? <Results data={mutation.data} displayRows={displayRows} /> : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-sm text-slate-500">
            Results appear here after a successful run. Use{' '}
            <strong className="font-medium text-slate-700">Jump to results</strong> in the bottom bar to
            scroll back quickly.
          </div>
        )}
      </div>

      <BbdLightModal
        open={dockPanel === 'presets'}
        onClose={closeDock}
        title="Presets and starter"
        description="Load and save named scenarios in this browser only, or pull the server seed again."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="block min-w-[12rem] flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Preset
              </span>
              <select
                value={selectedPresetId}
                onChange={e => setSelectedPresetId(e.target.value)}
                className={selectCls}
              >
                <option value="">Choose saved…</option>
                {sortedPresets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={btnMuted} onClick={loadPreset}>
              Load
            </button>
            <button
              type="button"
              disabled={!selectedPresetId}
              className={btnMuted}
              onClick={removePreset}
            >
              Delete
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="block min-w-[10rem] flex-1 max-w-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Save as
              </span>
              <input
                type="text"
                placeholder="preset name"
                value={presetName}
                maxLength={120}
                className={`w-full ${inputCls}`}
                onChange={e => setPresetName(e.target.value)}
              />
            </label>
            <button type="button" className={btnMuted} onClick={savePreset}>
              Save preset
            </button>
            <button type="button" className={btnMuted} onClick={resetBuiltinScenario}>
              Reset starter
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            <BbdDocsSectionLink
              section="workflow"
              label="Presets, JSON payloads, CLI scripts ›"
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
            />
          </p>
          {presetMsg ? (
            <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              {presetMsg}
            </p>
          ) : null}
        </div>
      </BbdLightModal>

      <BbdLightModal
        open={dockPanel === 'run'}
        onClose={closeDock}
        title="Run projection"
        description="Monte Carlo trial count and generate the on-page report (same request as POST /api/bbd-projection/run)."
      >
        <div className="space-y-4">
          <label htmlFor="bbd-mc-trials-modal" className="block">
            <OutputHoverTip
              tip={BBD_PAGE_HELP.monteCarloTrials}
              dashed={false}
              placement="below"
              className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Monte Carlo trials (0 = deterministic only)
            </OutputHoverTip>
            <input
              id="bbd-mc-trials-modal"
              type="number"
              min={0}
              value={mcTrials}
              onChange={e => setMcTrials(e.target.value)}
              className={`w-40 ${inputCls}`}
            />
          </label>
          <div>
            <BbdDocsSectionLink
              section="monteCarlo"
              label="Monte Carlo vs deterministic path ›"
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
            />
          </div>
          {mutation.isPending ? (
            <div className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50/90 px-3 py-2 text-sm text-teal-900">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
                aria-hidden
              />
              Generating report…
            </div>
          ) : null}
          {(parseError || mutation.isError) ? (
            <div className="rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm px-3 py-2">
              {parseError ??
                (mutation.error instanceof Error ? mutation.error.message : 'Request failed.')}
            </div>
          ) : null}
          <button
            type="button"
            onClick={runProjection}
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {mutation.isPending ? 'Running…' : 'Generate report'}
          </button>
        </div>
      </BbdLightModal>

      <BbdLightModal
        open={dockPanel === 'advanced'}
        onClose={closeDock}
        title="Advanced: scenario JSON"
        description="Edit the API payload shape; refresh pulls from the form, apply merges into the form."
        variant="wide"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnMuted} onClick={refreshAdvancedJson}>
              Refresh from form
            </button>
            <button type="button" className={btnMuted} onClick={applyAdvancedJson}>
              Apply JSON → form
            </button>
            <BbdDocsSectionLink
              section="workflow"
              label="Workflow & APIs ›"
              className="inline-flex items-center text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
            />
          </div>
          <textarea
            spellCheck={false}
            rows={14}
            value={advancedDraft}
            onChange={e => setAdvancedDraft(e.target.value)}
            className="w-full min-h-[12rem] font-mono text-xs leading-relaxed rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </BbdLightModal>

      <BbdLightModal
        open={dockPanel === 'export'}
        onClose={() => {
          setExportHint(null)
          closeDock()
        }}
        title="Export"
        description="Download or copy CSV / JSON from the current form and the last successful run."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              className={`${btnMuted} inline-flex flex-1 items-center justify-center`}
              disabled={!mutation.data?.schedule?.length}
              onClick={() => {
                if (!mutation.data?.schedule?.length) return
                const csv = scheduleToCsv(mutation.data.schedule)
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
                downloadBlob(`bbd-schedule-${stamp}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }))
                setExportHint('Downloaded full yearly schedule as CSV.')
              }}
            >
              Download schedule CSV
            </button>
            <button
              type="button"
              aria-label="Copy schedule CSV to clipboard"
              className={`${btnMuted} inline-flex shrink-0 items-center justify-center px-4 sm:min-w-[5.5rem]`}
              disabled={!mutation.data?.schedule?.length}
              onClick={() => {
                void (async () => {
                  if (!mutation.data?.schedule?.length) return
                  const csv = scheduleToCsv(mutation.data.schedule)
                  try {
                    await copyTextToClipboard(csv)
                    setExportHint('Schedule CSV copied to clipboard.')
                  } catch {
                    setExportHint('Clipboard unavailable — use Download or allow clipboard access for this site.')
                  }
                })()
              }}
            >
              Copy
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              className={`${btnMuted} inline-flex flex-1 items-center justify-center`}
              disabled={!mutation.data}
              onClick={() => {
                if (!mutation.data) return
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
                const text = JSON.stringify(mutation.data, null, 2)
                downloadBlob(
                  `bbd-run-response-${stamp}.json`,
                  new Blob([text], { type: 'application/json;charset=utf-8' }),
                )
                setExportHint('Downloaded last API response JSON.')
              }}
            >
              Download last run JSON
            </button>
            <button
              type="button"
              aria-label="Copy last run response JSON to clipboard"
              className={`${btnMuted} inline-flex shrink-0 items-center justify-center px-4 sm:min-w-[5.5rem]`}
              disabled={!mutation.data}
              onClick={() => {
                void (async () => {
                  if (!mutation.data) return
                  const text = JSON.stringify(mutation.data, null, 2)
                  try {
                    await copyTextToClipboard(text)
                    setExportHint('Last run response JSON copied to clipboard.')
                  } catch {
                    setExportHint('Clipboard unavailable — use Download or allow clipboard access for this site.')
                  }
                })()
              }}
            >
              Copy
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              className={`${btnMuted} inline-flex flex-1 items-center justify-center`}
              onClick={() => {
                const built = buildRunPayload()
                if (!built.ok) {
                  setExportHint('Fix Monte Carlo trials (non-negative integer) before exporting request JSON.')
                  return
                }
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
                const text = JSON.stringify(built.payload, null, 2)
                downloadBlob(
                  `bbd-run-request-${stamp}.json`,
                  new Blob([text], { type: 'application/json;charset=utf-8' }),
                )
                setExportHint('Downloaded request body JSON (scenario + optional Monte Carlo options).')
              }}
            >
              Download request JSON
            </button>
            <button
              type="button"
              aria-label="Copy request JSON to clipboard"
              className={`${btnMuted} inline-flex shrink-0 items-center justify-center px-4 sm:min-w-[5.5rem]`}
              onClick={() => {
                void (async () => {
                  const built = buildRunPayload()
                  if (!built.ok) {
                    setExportHint('Fix Monte Carlo trials (non-negative integer) before copying request JSON.')
                    return
                  }
                  const text = JSON.stringify(built.payload, null, 2)
                  try {
                    await copyTextToClipboard(text)
                    setExportHint('Request JSON copied to clipboard.')
                  } catch {
                    setExportHint('Clipboard unavailable — use Download or allow clipboard access for this site.')
                  }
                })()
              }}
            >
              Copy
            </button>
          </div>
          {exportHint ? <p className="text-xs text-slate-600">{exportHint}</p> : null}
        </div>
      </BbdLightModal>

      <div
        className="fixed inset-x-0 z-[95] flex justify-center pointer-events-none px-2"
        style={{ bottom: barBottom }}
        role="region"
        aria-label="BBD page actions"
      >
        <div className="pointer-events-auto flex max-w-[min(56rem,calc(100vw-1rem))] flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-lg shadow-slate-900/15 backdrop-blur-sm ring-1 ring-slate-900/5 sm:gap-2 sm:px-3 sm:py-2.5">
          <button
            type="button"
            onClick={() => openDocs()}
            aria-label="Open BBD guide"
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-2 py-2 text-xs font-semibold text-slate-800 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:gap-2 sm:px-2.5 sm:text-sm"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-inner sm:h-9 sm:w-9"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="translate-y-[0.5px] sm:h-[18px] sm:w-[18px]">
                <path
                  d="M8 3.25h9.75a2.25 2.25 0 012.25 2.25V18a3 3 0 01-3 3h-9A3 3 0 016 18v-13a3 3 0 013-1.75z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M8 8.25h8M8 12h8M8 15.75h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="hidden min-[400px]:inline">Docs</span>
          </button>
          <div className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden />
          <button
            type="button"
            aria-label="Presets and starter scenario"
            onClick={() => setDockPanel('presets')}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
          >
            Presets
          </button>
          <button
            type="button"
            aria-label="Run projection and Monte Carlo options"
            onClick={() => setDockPanel('run')}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
          >
            Run
          </button>
          <button
            type="button"
            aria-label="Advanced JSON editor"
            onClick={() => setDockPanel('advanced')}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
          >
            JSON
          </button>
          <button
            type="button"
            aria-label="Export CSV or JSON"
            onClick={() => {
              setExportHint(null)
              setDockPanel('export')
            }}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
          >
            Export
          </button>
          <button
            type="button"
            aria-label="Jump to results section"
            onClick={scrollToResults}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm"
          >
            <span className="hidden min-[420px]:inline">Jump to results</span>
            <span className="min-[420px]:hidden">Results</span>
          </button>
          <div className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden />
          <button
            type="button"
            aria-label="Generate projection report"
            onClick={runProjection}
            disabled={mutation.isPending}
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:px-4 sm:text-sm"
          >
            {mutation.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Results({
  data,
  displayRows,
}: {
  data: BbdRunResponse
  displayRows: BbdRunResponse['schedule']
}) {
  const vizModel = useMemo(() => buildBbdVizModel(data), [data])
  const [spatialOpen, setSpatialOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const mc = data.monte_carlo
  return (
    <div className="space-y-6">
      <BbdStoryDashboard data={data} />

      {vizModel.schedule.length >= 2 && !reducedMotion ? (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            className="rounded-lg text-sm font-semibold text-teal-800 underline decoration-dotted underline-offset-2 hover:bg-teal-50/80 hover:text-teal-950 px-2 py-1 -mx-2"
            onClick={() => setSpatialOpen(o => !o)}
          >
            {spatialOpen ? 'Hide spatial trajectory (3D)' : 'Show spatial trajectory (3D)'}
          </button>
          {spatialOpen ? (
            <div className="mt-4">
              <Suspense fallback={<p className="text-sm text-slate-500">Loading spatial view…</p>}>
                <BbdSpatialPanel model={vizModel} />
              </Suspense>
            </div>
          ) : null}
        </div>
      ) : null}

      {reducedMotion ? (
        <p className="text-xs text-slate-500 px-1">
          Full spatial 3D view stays off while system{' '}
          <strong className="font-medium text-slate-700">Reduce motion</strong> is enabled — charts above remain available.
        </p>
      ) : null}

      {mc ? (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <OutputHoverTip tip={OUTPUT_TIPS.monteIntro}>Monte Carlo summary</OutputHoverTip>
            </h2>
            <BbdDocsSectionLink
              section="monteCarlo"
              label="How MC shapes outcomes ›"
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2 shrink-0"
            />
          </div>
          <p className="text-xs text-slate-400">
            <OutputHoverTip tip={OUTPUT_TIPS.monte.trialsLabel} dashed={false}>
              Trials: {mc.n_trials}
            </OutputHoverTip>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.p10}>NW P10</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p10)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.p50}>NW P50</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p50)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.p90}>NW P90</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p90)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.mean}>NW mean</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_mean)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.margin}>Margin call rate</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{(mc.margin_call_rate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">
                <OutputHoverTip tip={OUTPUT_TIPS.monte.bankrupt}>Bankrupt rate</OutputHoverTip>
              </div>
              <div className="font-semibold tabular-nums">{(mc.bankrupt_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </section>
      ) : null}

      <details className="group rounded-xl border border-slate-100 bg-white shadow-sm open:ring-1 open:ring-teal-100">
        <summary className="cursor-pointer list-none border-b border-slate-100 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Detailed schedule table (expand)
            </span>
            <span className="text-xs font-medium text-teal-700 group-open:hidden">Tap to expand rows</span>
            <span className="hidden text-xs font-medium text-teal-700 group-open:inline">Tap to collapse</span>
          </div>
        </summary>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-50 px-5 pb-3 pt-2">
          <p className="max-w-prose text-xs text-slate-500">
            <OutputHoverTip tip={OUTPUT_TIPS.scheduleIntro} dashed={false}>
              Sampled rows for readability — figures are nominal USD unless you changed inflation in the scenario.
            </OutputHoverTip>
          </p>
          <BbdDocsSectionLink
            section="outputs"
            label="Reading the projection table ›"
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2 shrink-0"
          />
        </div>
        <div className="overflow-x-auto py-2">
          <table className="w-full text-xs">
            <thead className="relative z-10">
              <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.year} placement="below">
                    Year
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.age} placement="below">
                    Age
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.nw} placement="below">
                    NW
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.portfolio} placement="below">
                    Portfolio
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.pe} placement="below">
                    PE
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.re} placement="below">
                    RE
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.sbloc} placement="below">
                    SBLOC
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.draw} placement="below">
                    Draw
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom text-right">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.incomeYoYDelta} placement="below">
                    Δ Income
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom text-right">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.taxesYoYDelta} placement="below">
                    Δ Taxes
                  </OutputHoverTip>
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-2 align-bottom">
                  <OutputHoverTip tip={OUTPUT_TIPS.table.ltv} placement="below">
                    LTV
                  </OutputHoverTip>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <tr key={row.year} className="border-b border-slate-50 tabular-nums hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-slate-600">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.year} dashed={false} placement="below">
                      {row.year}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.age} dashed={false} placement="below">
                      {row.age}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.nw} dashed={false} placement="below">
                      {fmtUsd(row.net_worth)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.portfolio} dashed={false} placement="below">
                      {fmtUsd(row.portfolio_value)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.pe} dashed={false} placement="below">
                      {fmtUsd(row.pe_value)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.re} dashed={false} placement="below">
                      {fmtUsd(row.properties_value)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.sbloc} dashed={false} placement="below">
                      {fmtUsd(row.sbloc_balance)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.draw} dashed={false} placement="below">
                      {fmtUsd(row.drawdown_borrowed)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.incomeYoYDelta} dashed={false} placement="below">
                      {fmtUsdYoYDelta(row.gross_income_delta_yoy)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.taxesYoYDelta} dashed={false} placement="below">
                      {fmtUsdYoYDelta(row.taxes_delta_yoy)}
                    </OutputHoverTip>
                  </td>
                  <td className="px-3 py-2">
                    <OutputHoverTip tip={OUTPUT_TIPS.table.ltv} dashed={false} placement="below">
                      {`${(row.sbloc_ltv * 100).toFixed(1)}%`}
                    </OutputHoverTip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Terminal paths (heuristic)</p>
          <BbdDocsSectionLink
            section="outputs"
            label="Estate snapshots & deltas ›"
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2 shrink-0"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        {[data.estate_sell_path, data.estate_bbd_path].map(outcome => (
          <div
            key={outcome.label}
            className="space-y-2 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-800">
              <OutputHoverTip tip={OUTPUT_TIPS.estate.card}>{outcome.label}</OutputHoverTip>
            </h3>
            <dl className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.net}>Net to heirs</OutputHoverTip>
                </dt>
                <dd className="font-semibold tabular-nums text-slate-900">
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.net} dashed={false}>
                    {fmtUsd(outcome.net_to_heirs)}
                  </OutputHoverTip>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.debt}>Debt</OutputHoverTip>
                </dt>
                <dd className="tabular-nums">
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.debt} dashed={false}>
                    {fmtUsd(outcome.debt_to_repay)}
                  </OutputHoverTip>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.cgt}>Cap gains tax</OutputHoverTip>
                </dt>
                <dd className="tabular-nums">
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.cgt} dashed={false}>
                    {fmtUsd(outcome.cap_gains_tax)}
                  </OutputHoverTip>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.recapture}>Depreciation recapture tax</OutputHoverTip>
                </dt>
                <dd className="tabular-nums">
                  <OutputHoverTip tip={OUTPUT_TIPS.estate.recapture} dashed={false}>
                    {fmtUsd(outcome.depreciation_recapture_tax)}
                  </OutputHoverTip>
                </dd>
              </div>
            </dl>
          </div>
        ))}
        </div>
      </section>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-slate-400 min-w-[12rem] flex-1">
          <OutputHoverTip tip={OUTPUT_TIPS.advantage}>
            <>
              BBD vs sell-as-you-go heuristic advantage (terminal):{' '}
              <span className="font-semibold tabular-nums text-slate-600">
                {fmtUsd(data.bbd_net_advantage_vs_sell_path)}
              </span>
            </>
          </OutputHoverTip>
        </p>
        <BbdDocsSectionLink
          section="strategy"
          label="Strategy & comparisons ›"
          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2 shrink-0"
        />
      </div>
    </div>
  )
}
