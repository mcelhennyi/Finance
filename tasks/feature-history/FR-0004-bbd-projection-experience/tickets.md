# Tickets — FR-0004 bbd-projection-experience

**Feature id:** **`FR-0004`**  
**Canonical ids:** **`T-FR-0004-xx`**

---

### T-FR-0004-01 — BBD bottom control dock and relocated actions

**Title:** BBD bottom control dock and relocated actions  
**Deps:** `none`

#### Purpose

Provide a **persistent bottom-center control dock** on the BBD page so **Docs**, **Generate report** / export, and primary run-adjacent actions live in one **operable** strip (per intake). Remove duplicated header clutter; preserve modal/drawer stacking rules (`z-index` below global overlays).

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | UX contract | Snapshot or minimal component test for dock presence + action callbacks wired |
| **DEV** | Implement dock | `BbdControlDock` (or equivalent); **`BbdProjectionPage`** wires existing docs + report handlers; mobile safe-area padding |
| **VAL** | Compose check | `./develop` / Compose frontend build; manual pass: dock visible, actions fire |

#### Notes

- Iconography should match existing **`Layout`** / page chrome conventions.

---

### T-FR-0004-02 — BBD visualization view-model and chart-ready series

**Title:** BBD visualization view-model and chart-ready series  
**Deps:** `none`

#### Purpose

Centralize **pure** transforms from **`BbdRunResponse`** → immutable structures for **`recharts`** and the spatial layer: time-indexed series (NW, assets/liabilities components as needed), **LTV / margin** flags for annotation, **YoY** income/tax deltas, estate comparison pairs, Monte summary chips, optional **phase labels** (e.g. years with elevated borrow draws).

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Golden transforms | **`vitest`** covers edge cases: empty schedule guard, single row, MC null vs populated |
| **DEV** | Module + exports | `bbdVizModel` (or `lib/bbdVizModel.ts`) with typed outputs; no React imports |
| **VAL** | CI | Frontend **`npm test`** / Docker-equivalent green |

#### Notes

- Align naming with **`frontend/src/types.ts`** (`BbdScheduleRow`, etc.).

---

### T-FR-0004-03 — BBD 2D story dashboard and educational callouts

**Title:** BBD 2D story dashboard and educational callouts  
**Deps:** `T-FR-0004-01`, `T-FR-0004-02`

#### Purpose

Replace table-first layout with a **story dashboard**: composed **`recharts`** figures (areas/lines/bars), **collapsible** detailed table, and **educational callouts** (Buy / Borrow / Die framing, leverage caveats, Monte interpretation) sourced from extended tip maps — **not** legal advice; scenario math only.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Smoke | Render tests or story-driven checks that charts mount given mock **`VizModel`** |
| **DEV** | Build dashboard | `BbdStoryDashboard` + insight rail; integrate **`OUTPUT_TIPS`** evolution |
| **VAL** | UX review | Deterministic + small MC run in container; copy reviewed for disclaimer consistency |

#### Notes

- Reuse **`BbdGuideContent`** patterns where possible (links to **`HANDOFF.md`**).

---

### T-FR-0004-04 — BBD spatial / 3D–time experience (lazy WebGL)

**Title:** BBD spatial / 3D–time experience (lazy WebGL)  
**Deps:** `T-FR-0004-02`, `T-FR-0004-03`

#### Purpose

Add an **optional immersive view**: **`@react-three/fiber`** + **`three`** (+ **`drei`** helpers), **lazy-loaded** so the default bundle stays lean. Map trajectory in a **3D workspace** (e.g. year × net worth × leverage or similar interpretable axes) with a **time scrubber** as explicit **fourth-dimension** navigation. Honor **`prefers-reduced-motion`**: skip auto-rotate / heavy animation; offer **2D-only** fallback content.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Fallback path | Unit or RTL check that reduced-motion path skips canvas mount if required |
| **DEV** | Lazy scene | Dynamic import boundary + suspense fallback; minimal interaction contract |
| **VAL** | Perf spot-check | Lighthouse/bundle note in diary; no blocking main-thread spin on open |

#### Notes

- Add **`three`**, **`@react-three/fiber`**, **`@react-three/drei`** to **`frontend/package.json`** as part of DEV.

---

### T-FR-0004-05 — BBD experience integration VAL and operator docs

**Title:** BBD experience integration VAL and operator docs  
**Deps:** `T-FR-0004-04`

#### Purpose

End-to-end **VAL**: accessibility basics (keyboard focus order for dock + charts), contrast checks on callouts, update **`scripts/README.md`** (or BBD script section) only if **report/export** workflow text changed; confirm **`vitest`** coverage for **`bbdVizModel`**.

#### Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **TEST** | Regression | Full frontend test suite green |
| **DEV** | Doc touch-ups | Operator-facing paths accurate |
| **VAL** | Sign-off | Dockerized build + manual checklist in **`serial-diary.md`** or **`handoffs/`** |

#### Notes

- Coordinate **`/finish-feature`** when merging **`feat/FR-0004-bbd-projection-experience`** → default branch.
