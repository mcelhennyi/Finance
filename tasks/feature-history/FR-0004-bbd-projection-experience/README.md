# FR-0004 — BBD projection immersive experience

**Status:** `complete` on **`master`** — integration **[PR #7](https://github.com/mcelhennyi/Finance/pull/7)** · closeout [`90-closeout.md`](90-closeout.md) · finish handoff [`handoffs/2026-05-10-finish-feature.md`](handoffs/2026-05-10-finish-feature.md)

**Depends on:** shipped **`FR-0003`** (**`POST /api/bbd-projection/run`**, existing **`BbdRunResponse`** types); extends **`frontend/src/pages/BbdProjectionPage.tsx`** and related BBD components only unless a **`DESIGN-GAP`** forces API extensions.

## Artifacts

| Doc | Purpose |
|-----|---------|
| [`00-intake.md`](00-intake.md) | Goals, constraints, success criteria |
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | Public UI contracts and visualization boundaries |
| [`20-tickets-dag.md`](20-tickets-dag.md) | Ticket table + Mermaid DAG (draft; mirrors [`tickets.md`](tickets.md)) |
| [`tickets.md`](tickets.md) | Canonical **`T-FR-0004-xx`** sections |
| [`serial-diary.md`](serial-diary.md) | Serial session notes |
| [`handoffs/2026-05-09-pr-to-master.md`](handoffs/2026-05-09-pr-to-master.md) | Pre-merge PR handoff |
| [`handoffs/2026-05-10-finish-feature.md`](handoffs/2026-05-10-finish-feature.md) | **`/finish-feature`** bookkeeping (post-merge) |
| [`90-closeout.md`](90-closeout.md) | Final synopsis + artifact index |

## Summary

Replace “flat table first” BBD output with a **story-first, educational** presentation: **sticky bottom control center** (docs + report + run affordances), rich **2D charts** (existing **`recharts`**), optional **lazy-loaded 3D / time-as-4th-dimension** scene (**`three`** + **`@react-three/fiber`**) for spatial intuition, and **guided insights** tied to Buy / Borrow / Die mechanics — without changing tax advice posture (still scenario math, not individualized guidance).
