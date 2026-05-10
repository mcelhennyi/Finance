# FR-0004 — PR handoff (immersive BBD experience)

## Branch

- **`feat/FR-0004-bbd-projection-experience`** (from **`master`**)
- **Stack:** This branch **cherry-picks** the previously unmerged **`feat/FR-0003-bbd-ui-followup`** commits (**modal guide, presets, YAML default hydrate** + docs PR link) so the immersive UI builds on the same SPA surface as local development. **`master`** on the remote did not yet contain those commits at branch creation time.

## PR

- Create: **`gh pr create --base master --head feat/FR-0004-bbd-projection-experience`**
- **PR URL:** *(replace after create)*

## VAL (2026-05-09)

- **`docker compose run --rm web sh -c "npm run lint && npm test"`** — pass (**`tsc --noEmit`**, **vitest** including **`bbdVizModel.test.ts`**).

## Executive summary

Immersive BBD experience: **`bbdVizModel`** + tests, **`BbdStoryDashboard`**, lazy **`BbdSpatialPanel`** (**`three`** stack), **`BbdLightModal`**, output tips, bottom dock workflow on **`BbdProjectionPage`**, CLI bundle **`scripts/bbd-projection/`** (with **`ian.toml`** gitignored per README), template path fixes in **`engine.py`** / seed TOML header. **`FR-0003`** **`90-closeout.md`** and **`ticket-progress`** updates are included in the same integration commit as documented in the main feature commit message.

**Not in this branch:** Settings / Parameters rename (gear nav); keep that for a separate PR if still desired.

## Suggested next step

Open **PR → `master`**, describe the **FR-0003 follow-up + FR-0004** bundle in the PR body, merge when green.

## Options

- **A — Single PR (this branch):** Delivers follow-up + FR-0004 together; fastest if **`master`** lacked the modal/preset work.
- **B — Split history:** Land **`feat/FR-0003-bbd-ui-followup`** on **`master`** first, then rebase this branch to drop the first cherry-picks.

## Bookkeeping after merge

- Set **`FR-0004`** to **`complete`** in **`tasks/feature-history/REGISTRY.md`**.
- Mark **`T-FR-0004-01`** … **`T-FR-0004-05`** VAL **`done`** in **`tasks/ticket-progress.md`** if not already; refresh **Current focus** and **Parallel streams** per **`feature-request`** closeout (retire completed **`FR-0004`** row).
- Add **`90-closeout.md`** for **`FR-0004`** per **`feature-request`** closeout (separate from **`FR-0003`** **`90-closeout.md`**).
- Remove repo-root **`CURRENT.md`** on merge to **`master`** if present.
