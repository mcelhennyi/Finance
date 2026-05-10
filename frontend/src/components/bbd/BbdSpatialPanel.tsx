import { Canvas } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'

import type { BbdVizModel } from '../../lib/bbdVizModel'
import { BBD_OUTPUT_TIPS } from './bbdOutputTips'

/** Normalized trajectory for WebGL: x = time, y = net worth, z = SBLOC LTV (clamped). */
function buildLinePoints(model: BbdVizModel): [number, number, number][] {
  const { schedule, bounds } = model
  if (!schedule.length || !bounds) return []
  const spanY = bounds.yearMax - bounds.yearMin || 1
  const spanNw = bounds.nwMax - bounds.nwMin || 1
  return schedule.map(p => {
    const x = ((p.year - bounds.yearMin) / spanY) * 2 - 1
    const y = ((p.netWorth - bounds.nwMin) / spanNw) * 2 - 1
    const lt = Math.min(1, Math.max(0, p.sblocLtv))
    const z = lt * 2 - 1
    return [x, y, z] as [number, number, number]
  })
}

export default function BbdSpatialPanel({ model }: { model: BbdVizModel }) {
  const linePoints = useMemo(() => buildLinePoints(model), [model])
  const [idx, setIdx] = useState(0)
  const schedule = model.schedule

  const safeIdx = Math.min(Math.max(0, idx), Math.max(0, schedule.length - 1))
  const cursor = linePoints[safeIdx]

  if (!linePoints.length) return null

  return (
    <section className="rounded-xl border border-slate-100 bg-slate-950 p-5 shadow-inner">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-teal-400/90">
            Spatial trajectory (3D)
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-slate-400">{BBD_OUTPUT_TIPS.story.spatial}</p>
        </div>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[11px] text-slate-400 sm:max-w-md">
          <span className="flex justify-between gap-2 font-medium text-slate-300">
            <span>Scrub time (year)</span>
            <span className="tabular-nums text-teal-300">{schedule[safeIdx]?.year ?? '—'}</span>
          </span>
          <input
            type="range"
            min={0}
            max={schedule.length - 1}
            value={safeIdx}
            onChange={e => setIdx(Number.parseInt(e.target.value, 10))}
            className="accent-teal-500"
          />
        </label>
      </div>
      <div className="mt-4 h-[min(360px,55vh)] w-full overflow-hidden rounded-lg bg-slate-900 ring-1 ring-white/10">
        <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 6, 4]} intensity={0.9} />
          <gridHelper args={[3.2, 14, '#334155', '#1e293b']} position={[0, -1.05, 0]} />
          <Line points={linePoints} color="#2dd4bf" lineWidth={2.5} dashed={false} />
          {cursor ? (
            <mesh position={cursor}>
              <sphereGeometry args={[0.065, 28, 28]} />
              <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.35} />
            </mesh>
          ) : null}
          <OrbitControls enableDamping dampingFactor={0.08} makeDefault />
        </Canvas>
      </div>
      <dl className="mt-4 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-3">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Net worth</dt>
          <dd className="tabular-nums text-slate-200">
            {schedule[safeIdx]
              ? `$${Math.round(schedule[safeIdx].netWorth).toLocaleString()}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">SBLOC LTV</dt>
          <dd className="tabular-nums text-slate-200">
            {schedule[safeIdx] ? `${(schedule[safeIdx].sblocLtv * 100).toFixed(1)}%` : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-500">Borrow draw</dt>
          <dd className="tabular-nums text-slate-200">
            {schedule[safeIdx]
              ? `$${Math.round(schedule[safeIdx].drawdownBorrowed).toLocaleString()}`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
