# Serial diary — FR-0004

## 2026-05-09 — Implementation (FR-0004 option B)

**Stage:** implementation on feature branch.

**Summary:** Implemented **`bbdVizModel`** + tests; **`BbdStoryDashboard`** (NW area, composition lines, draws vs LTV composed chart); lazy **`BbdSpatialPanel`** (`three`, `@react-three/fiber`, `@react-three/drei`) with year scrubber and reduce-motion gate; extracted **`BBD_OUTPUT_TIPS`**; collapsible detailed table; dock label **Docs**; fixed missing **`</section>`** in **`BbdGuideContent.tsx`** (workflow section). Docker **`web`** image rebuilt; **`docker compose run web npm run lint`** + **`npm test`** green. **`scripts/README.md`** notes SPA visualization stack.

**Next:** PR / merge to default branch; optional **`vite build`** smoke in CI.

---

## 2026-05-09 — Intake + L0 design + tickets landed

**Stage:** design (registry + **`FR-0004`** folder).

**Summary:** Registered **`FR-0004`** (**bbd-projection-experience**) after shipped **`FR-0003`**. Captured request for **bottom control dock**, **rich 2D storytelling** atop existing **`recharts`**, **lazy WebGL** (**`three`** / **`@react-three/fiber`**) for spatial intuition with **time scrubbing** as navigable “fourth dimension,” and **educational callouts** grounded in scenario math only. Authored **`00-intake.md`**, **`10-design-00-skeleton.md`**, **`20-tickets-dag.md`**, canonical **`tickets.md`** (**`T-FR-0004-01`**–**`05`**), updated **`REGISTRY.md`**, **`TICKET-SOURCES.md`**, **`docs/design/tickets-initial.md`**, **`tasks/ticket-progress.md`**.

**Next:** Reserve **`feat/FR-0004-bbd-projection-experience`** when implementation starts; run **`/identify-frontier`** then **`/develop-frontier`**.
