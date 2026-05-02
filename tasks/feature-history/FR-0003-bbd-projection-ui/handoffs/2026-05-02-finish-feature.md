# Finish feature handoff — FR-0003 follow-up (**`feat/FR-0003-bbd-ui-followup`**)

**Date:** 2026-05-02  
**Integrated branch:** **`feat/FR-0003-bbd-ui-followup`** → **`master`** (pull request).

## Planned vs actual

See [`../planned-vs-actual.md`](../planned-vs-actual.md) (**documentation traceability** + **`FR-0003`** / **`T-FR-0003-xx`** mapping).

## PR

**PR:** https://github.com/mcelhennyi/Finance/pull/6 (**`feat/FR-0003-bbd-ui-followup`** → **`master`**).

## What was integrated (executive summary)

Modal-first BBD operator guide (**scroll restore** vs **anchor** jumps), floating lower-right launcher, richer SPA (**presets**, tooltips), **`GET /api/bbd-projection/default-scenario`**, illustrative **`data/seed-statements/ian.yaml`** for compose-mounted **`/seed`**, schema/engine tightening, pytest coverage extensions.

## Validation

Target: **`docker compose run --rm api pytest`** against current tree; **`mkdocs build`** run ad hoc in **`api`** image with **`pip install mkdocs`** if not pinned (doc gate — see notes in **`planned-vs-actual.md`**). Host-only runs documented here if Docker unavailable in an agent sandbox.

## Suggested next step (human reviewer)

Review PR; confirm **`ian.yaml`** sample is acceptable as a committed illustrative fixture (**not** individualized data). Merge to **`master`**. No **`CURRENT.md`** on **`master`** in this snapshot.

## Options

| Option | Notes |
|--------|--------|
| **Merge** | Ship follow-up **`FR-0003`** UX + API hydrate path. |
| **Request changes** | Rename **`ian.yaml`** to a neutral **`bbd-default-sample.yaml`** and repoint **`FINANCE_BBD_DEFAULT_YAML`** + tests — minimal mechanical follow-up branch. |
