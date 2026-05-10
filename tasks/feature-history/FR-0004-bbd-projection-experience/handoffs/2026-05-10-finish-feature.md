# Finish feature — FR-0004 (post-merge bookkeeping)

## Merged integration

- **Feature branch:** **`feat/FR-0004-bbd-projection-experience`** (tip **`d2014d6`** pre-merge; included FR-0003 SPA follow-up commits rebased/cherry-picked on that line).
- **Default branch merge:** **`master`** @ **`01842f3`** — *Merge pull request #7 from mcelhennyi/feat/FR-0004-bbd-projection-experience*
- **PR:** https://github.com/mcelhennyi/Finance/pull/7

## Ticket / stage branches

No separate **`feat/FR-0004-bbd-projection-experience/T-FR-…`** ticket branches were used; work was integrated on the feature branch and delivered in a single PR. Remote ticket/stage naming remains available for future features.

## Validation (at integration time)

- **`docker compose run --rm web sh -c "npm run lint && npm test"`** — pass (**`tsc --noEmit`**, **vitest**).

## Executive summary

**[BBD bottom control dock and relocated actions](tickets.md#t-fr-0004-01--bbd-bottom-control-dock-and-relocated-actions)** (**[`T-FR-0004-01`](tickets.md)**), **[BBD visualization view-model and chart-ready series](tickets.md#t-fr-0004-02--bbd-visualization-view-model-and-chart-ready-series)** (**[`T-FR-0004-02`](tickets.md)**), **[BBD 2D story dashboard and educational callouts](tickets.md#t-fr-0004-03--bbd-2d-story-dashboard-and-educational-callouts)** (**[`T-FR-0004-03`](tickets.md)**), **[BBD spatial / 3D–time experience (lazy WebGL)](tickets.md#t-fr-0004-04--bbd-spatial--3dtime-experience-lazy-webgl)** (**[`T-FR-0004-04`](tickets.md)**), and **[BBD experience integration VAL and operator docs](tickets.md#t-fr-0004-05--bbd-experience-integration-val-and-operator-docs)** (**[`T-FR-0004-05`](tickets.md)**) are integrated on **`master`** via **PR #7**. This handoff plus **`90-closeout.md`** align **`REGISTRY.md`** and the feature **`README.md`** with that reality (skill step 4 after human merge).

## Suggested next step

Merge the bookkeeping PR: **[#8](https://github.com/mcelhennyi/Finance/pull/8)** (this change set).

## Options

- **A.** Merge bookkeeping PR and leave **`feat/FR-0004-*`** remote branch for history (**recommended**).
- **B.** If **`docs/design/tickets-initial.md`** should mark all **`T-FR-0004-*`** triads **`triadDone`** on **`master`**, confirm that file already matches **`ticket-progress.md`** and amend this PR if not.
