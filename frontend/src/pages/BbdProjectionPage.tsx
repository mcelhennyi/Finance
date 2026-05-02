import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { api } from '../api/client'
import { BbdScenarioFields } from '../components/bbd/BbdScenarioFields'
import { BBD_PAGE_HELP } from '../components/bbd/bbdFieldTips'
import { BbdDocsSectionLink, useBbdDocs } from '../components/bbd/BbdDocsContext'
import { OutputHoverTip } from '../components/OutputHoverTip'
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
import type { BbdRunPayload, BbdRunResponse } from '../types'

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

/** Help copy for abbreviated BBD projection outputs — shown via `OutputHoverTip` only (no native `title`, avoids double tooltips). */
const OUTPUT_TIPS = {
  scheduleIntro:
    'Sampled rows: every fifth simulated year plus final horizon year. Figures are nominal USD from the scenario unless you adjusted inflation assumptions.',
  monteIntro:
    'Uses random draws across trials (portfolio, rates where stochastic, PE events). Bands show dispersion of outcomes, not a forecast distribution.',
  table: {
    year: 'Calendar year summarized by this modeled annual timestep.',
    age: 'Modeled age in completed years at the end of that year.',
    nw: 'Net worth: modeled total assets minus total liabilities.',
    portfolio: 'Taxable portfolio market value; SBLOC is modeled against this collateral.',
    pe: 'Private / illiquid equity mark for the year before modeled exits/write-downs crystallize.',
    re: 'Sum of modeled property appraisals tied to mortgages and rents.',
    sbloc: 'Outstanding securities-backed line of credit balance.',
    draw: 'Annual draw modeled as borrowing-based cash extraction in the borrow phase (nominal USD for that row).',
    incomeYoYDelta:
      'Change vs prior year in modeled nominal cash receipts: W-2 + net rental ops + portfolio dividends modeled as paid + borrowing draws. First modeled year blank.',
    taxesYoYDelta:
      'Change vs prior year in modeled tax outflow (marginal ordinary + modeled dividend/stack taxes, including forced-sale tax if modeled). First year blank.',
    ltv: 'SBLOC borrowing divided by portfolio collateral in the simulation (borrow stress indicator).',
  },
  monte: {
    p10: '10th percentile of final-year net worth: 10 percent of trials finished below this.',
    p50: 'Median final-year net worth across trials.',
    p90: '90th percentile of final NW: most trials landed below this upside tail benchmark.',
    mean: 'Arithmetic mean of final NW (can differ from median if outcomes are skewed).',
    margin: 'Fraction of trials with at least one modeled SBLOC margin-style event.',
    bankrupt: 'Fraction of trials tripping the modeled insolvency / bankrupt heuristic.',
    trialsLabel: 'Number of independent stochastic paths summarized here.',
  },
  estate: {
    card: 'Heuristic liquidation / step-up story at horizon; not individualized estate planning.',
    net: 'After modeled debt payoff and liquidation taxes on that path.',
    debt: 'SBLOC/refi modeled as owing at horizon in that heuristic.',
    cgt:
      'Aggregated modeled capital gains tax on appreciating assets crystallized under that heuristic (see raw API for depreciation recapture split-out).',
    recapture:
      'Depreciation-recapture bite modeled separately from headline long-term gains in terminal tax stack.',
  },
  advantage:
    'Modeled heirs net under BBD-style terminal story minus stylized sell-and-pay-tax story. Interpret as scenario math only.',
} satisfies {
  scheduleIntro: string
  monteIntro: string
  table: Record<string, string>
  monte: Record<string, string>
  estate: Record<string, string>
  advantage: string
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

  const mutation = useMutation({
    mutationFn: (payload: BbdRunPayload) => api.bbdProjectionRun(payload),
  })

  const scheduleRows = mutation.data?.schedule ?? []
  const displayRows = useMemo(() => {
    if (!scheduleRows.length) return []
    const out: typeof scheduleRows = []
    for (let i = 0; i < scheduleRows.length; i++) {
      if (i % 5 === 0 || i === scheduleRows.length - 1) out.push(scheduleRows[i])
    }
    return out
  }, [scheduleRows])

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

  const runProjection = () => {
    setParseError(null)
    setPresetMsg(null)
    const trials = Number.parseInt(mcTrials, 10)
    if (Number.isNaN(trials) || trials < 0) {
      setParseError('Monte Carlo trials must be a non-negative integer.')
      return
    }
    mutation.mutate({
      scenario: scenarioToApiPayload(scenario),
      ...(trials === 0 ? {} : { monte_carlo_trials: trials, monte_carlo_seed: 42 }),
    })
  }

  const selectCls =
    'mt-1 min-w-[12rem] max-w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500'

  const inputCls =
    'mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

  const btnMuted =
    'rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40'

  return (
    <div className="space-y-6">
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
            ).
            Optionally merge JSON snippets in <strong className="font-medium">Advanced</strong>.
            Scenario <strong className="font-medium">presets</strong> are stored locally in{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">localStorage</code> for this browser
            only. For repeatable TOML runs, continue using{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">scripts/bbd_projection.py</code>.
          </p>
          <p className="text-sm mt-2 text-slate-600">
            <button
              type="button"
              onClick={() => openDocs()}
              className="font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
            >
              Open full BBD guide
            </button>
            <span className="text-slate-500"> — continues where you left off when you reopen (floating docs button).</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="block">
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
          <label className="block flex-1 min-w-[8rem] max-w-[16rem]">
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

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="bbd-mc-trials" className="block">
              <OutputHoverTip
                tip={BBD_PAGE_HELP.monteCarloTrials}
                dashed={false}
                placement="below"
                className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Monte Carlo trials (0 = deterministic only)
              </OutputHoverTip>
              <input
                id="bbd-mc-trials"
                type="number"
                min={0}
                value={mcTrials}
                onChange={e => setMcTrials(e.target.value)}
                className={`w-36 ${inputCls}`}
              />
            </label>
            <div className="mt-1.5">
              <BbdDocsSectionLink
                section="monteCarlo"
                label="Monte Carlo vs deterministic path ›"
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={runProjection}
            disabled={mutation.isPending}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 shrink-0"
          >
            {mutation.isPending ? 'Running…' : 'Run projection'}
          </button>
        </div>

        {(parseError || mutation.isError) && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">
            {parseError ??
              (mutation.error instanceof Error ? mutation.error.message : 'Request failed.')}
          </div>
        )}

        <BbdScenarioFields scenario={scenario} setScenario={setScenario} />

        <details
          className="rounded-xl border border-slate-100 bg-slate-50/50 p-5"
          onToggle={ev => {
            const el = ev.currentTarget
            if (el.open) refreshAdvancedJson()
          }}
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-800 selection:bg-teal-100 [&::-webkit-details-marker]:hidden">
            <span>Advanced: raw scenario JSON (API payload mirrors form)</span>
            <BbdDocsSectionLink
              section="workflow"
              label="Workflow & APIs ›"
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline decoration-dotted underline-offset-2 shrink-0"
            />
          </summary>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnMuted} onClick={refreshAdvancedJson}>
                Refresh from form
              </button>
              <button type="button" className={btnMuted} onClick={applyAdvancedJson}>
                Apply JSON → form
              </button>
            </div>
            <textarea
              spellCheck={false}
              rows={18}
              value={advancedDraft}
              onChange={e => setAdvancedDraft(e.target.value)}
              className="w-full font-mono text-xs leading-relaxed rounded-lg border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </details>
      </section>

      {mutation.data ? <Results data={mutation.data} displayRows={displayRows} /> : null}
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
  const mc = data.monte_carlo
  return (
    <div className="space-y-6">
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

      <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <OutputHoverTip tip={OUTPUT_TIPS.scheduleIntro}>Year-by-year (every 5th year + final)</OutputHoverTip>
          </h2>
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
      </section>

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
