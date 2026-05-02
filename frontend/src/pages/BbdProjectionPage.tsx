import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { BbdScenarioFields } from '../components/bbd/BbdScenarioFields'
import { api } from '../api/client'
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

export function BbdProjectionPage() {
  const [scenario, setScenario] = useState<BbdScenarioState>(() => createDefaultScenario())
  const [presets, setPresets] = useState<BbdPreset[]>([])

  useEffect(() => {
    try {
      setPresets(loadPresets())
    } catch {
      setPresets([])
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
    setScenario(createDefaultScenario())
    setPresetMsg('Reset fields to Finance Hub starter template.')
    setParseError(null)
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
            Optionally merge JSON snippets in <strong className="font-medium">Advanced</strong>.
            Scenario <strong className="font-medium">presets</strong> are stored locally in{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">localStorage</code> for this browser
            only. For repeatable TOML runs, continue using{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">scripts/bbd_projection.py</code>.
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
        {presetMsg ? (
          <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
            {presetMsg}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="bbd-mc-trials" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Monte Carlo trials (0 = deterministic only)
            </label>
            <input
              id="bbd-mc-trials"
              type="number"
              min={0}
              value={mcTrials}
              onChange={e => setMcTrials(e.target.value)}
              className={`w-36 ${inputCls}`}
            />
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
          <summary className="cursor-pointer text-sm font-semibold text-slate-800 selection:bg-teal-100">
            Advanced: raw scenario JSON (API payload mirrors form)
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Monte Carlo summary
          </h2>
          <p className="text-xs text-slate-400">Trials: {mc.n_trials}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-slate-400 text-[11px] uppercase">NW P10</div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p10)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">NW P50</div>
              <div className="font-semibold tabular-nums">{fmtUsd(mc.final_nw_p50)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">Margin call rate</div>
              <div className="font-semibold tabular-nums">{(mc.margin_call_rate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] uppercase">Bankrupt rate</div>
              <div className="font-semibold tabular-nums">{(mc.bankrupt_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Year-by-year (every 5th year + final)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/90 border-b border-slate-100">
                <th className="px-3 py-2 whitespace-nowrap">Year</th>
                <th className="px-3 py-2 whitespace-nowrap">Age</th>
                <th className="px-3 py-2 whitespace-nowrap">NW</th>
                <th className="px-3 py-2 whitespace-nowrap">Portfolio</th>
                <th className="px-3 py-2 whitespace-nowrap">PE</th>
                <th className="px-3 py-2 whitespace-nowrap">RE</th>
                <th className="px-3 py-2 whitespace-nowrap">SBLOC</th>
                <th className="px-3 py-2 whitespace-nowrap">Draw</th>
                <th className="px-3 py-2 whitespace-nowrap">LTV</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <tr key={row.year} className="border-b border-slate-50 hover:bg-slate-50/50 tabular-nums">
                  <td className="px-3 py-2 text-slate-600">{row.year}</td>
                  <td className="px-3 py-2 text-slate-600">{row.age}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{fmtUsd(row.net_worth)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.portfolio_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.pe_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.properties_value)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.sbloc_balance)}</td>
                  <td className="px-3 py-2">{fmtUsd(row.drawdown_borrowed)}</td>
                  <td className="px-3 py-2">{`${(row.sbloc_ltv * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[data.estate_sell_path, data.estate_bbd_path].map(outcome => (
          <div key={outcome.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">{outcome.label}</h3>
            <dl className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Net to heirs</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">{fmtUsd(outcome.net_to_heirs)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Debt</dt>
                <dd className="tabular-nums">{fmtUsd(outcome.debt_to_repay)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Cap gains tax</dt>
                <dd className="tabular-nums">{fmtUsd(outcome.cap_gains_tax)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <p className="text-xs text-slate-400">
        BBD vs sell-as-you-go heuristic advantage (terminal):{' '}
        <span className="font-semibold text-slate-600 tabular-nums">
          {fmtUsd(data.bbd_net_advantage_vs_sell_path)}
        </span>
      </p>
    </div>
  )
}
