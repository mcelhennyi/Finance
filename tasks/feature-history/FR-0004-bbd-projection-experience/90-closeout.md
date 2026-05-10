# FR-0004 closeout

## Executive summary

**FR-0004** (BBD projection immersive experience) is **complete** per **`REGISTRY.md`**: story-first **`BbdProjectionPage`** with bottom dock, **`bbdVizModel`** + **`vitest`**, **`BbdStoryDashboard`**, lazy **`BbdSpatialPanel`** (**`three`** / **`@react-three/fiber`**), modal docs (**`BbdLightModal`**), output tips, **`scripts/bbd-projection/`** bundle (with gitignored local **`ian.toml`**), and task tracker updates. Integration landed on **`master`** via **[PR #7](https://github.com/mcelhennyi/Finance/pull/7)** (merge commit **`01842f3`**). This followed the unmerged **FR-0003** SPA follow-up (modal guide, presets, default scenario **`GET`**) that was cherry-picked on the feature branch before the same PR.

## Artifact links

- [`00-intake.md`](00-intake.md)
- [`10-design-00-skeleton.md`](10-design-00-skeleton.md)
- [`20-tickets-dag.md`](20-tickets-dag.md)
- [`tickets.md`](tickets.md)
- [`serial-diary.md`](serial-diary.md)
- [`README.md`](README.md)
- [`handoffs/2026-05-09-pr-to-master.md`](handoffs/2026-05-09-pr-to-master.md)
- [`handoffs/2026-05-10-finish-feature.md`](handoffs/2026-05-10-finish-feature.md)

## Branch / PR

- Feature integration branch (historical): **`feat/FR-0004-bbd-projection-experience`**
- Integrated PR: **[#7](https://github.com/mcelhennyi/Finance/pull/7)** → **`master`**
- Bookkeeping PR (registry + closeout files): **[#8](https://github.com/mcelhennyi/Finance/pull/8)** → **`master`**
- No repo-root **`CURRENT.md`** required cleanup on **`master`** for this feature (none was committed on default branch).

## Ticket mapping (title first)

- **BBD bottom control dock and relocated actions** — **`T-FR-0004-01`** ([`tickets.md`](tickets.md))
- **BBD visualization view-model and chart-ready series** — **`T-FR-0004-02`** ([`tickets.md`](tickets.md))
- **BBD 2D story dashboard and educational callouts** — **`T-FR-0004-03`** ([`tickets.md`](tickets.md))
- **BBD spatial / 3D–time experience (lazy WebGL)** — **`T-FR-0004-04`** ([`tickets.md`](tickets.md))
- **BBD experience integration VAL and operator docs** — **`T-FR-0004-05`** ([`tickets.md`](tickets.md))

## Suggested next step

Merge bookkeeping **[PR #8](https://github.com/mcelhennyi/Finance/pull/8)**; then resume **`FR-0002`** from **`tasks/ticket-progress.md` → Current focus**.

## Options

- **A.** Keep **`feat/FR-0004-bbd-projection-experience`** on the remote as an audit trail; do not delete without an explicit team decision.
- **B.** Optional CI addition: **`vite build`** smoke for the frontend image if not already covered elsewhere.
- **C.** New **`FR-NNNN`** per **`REGISTRY.md`** **`next_id`** for the next product slice.
