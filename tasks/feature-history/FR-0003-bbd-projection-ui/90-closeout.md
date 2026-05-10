# FR-0003 closeout

## Executive summary

FR-0003 (BBD projection web UI) is **complete** per **`REGISTRY.md`**: packaged **`finance.bbd`** engine, **`POST /api/bbd-projection/run`**, BBD SPA page with disclaimers and schedules/MC output, operator docs in **`scripts/README.md`**, and CLI **`scripts/bbd-projection/`**. A follow-up tranche on **`feat/FR-0003-bbd-ui-followup`** (modal guide, presets, default-scenario **`GET`**, seed YAML, extended tests) is captured in **`planned-vs-actual.md`** and integrated via **PR [#6](https://github.com/mcelhennyi/Finance/pull/6)** to **`master`** per feature **`README.md`**.

## Artifact links

- [`00-intake.md`](00-intake.md)
- [`10-design-00-skeleton.md`](10-design-00-skeleton.md)
- [`20-tickets-dag.md`](20-tickets-dag.md)
- [`tickets.md`](tickets.md)
- [`serial-diary.md`](serial-diary.md)
- [`planned-vs-actual.md`](planned-vs-actual.md)
- [`README.md`](README.md)

## Branch / PR

- Follow-up branch (historical): **`feat/FR-0003-bbd-ui-followup`**
- Integrated PR: **[#6](https://github.com/mcelhennyi/Finance/pull/6)** → **`master`**
- Repo-root **`CURRENT.md`**: remove on **`master`** after merge per workflow when present on feature work.

## Ticket mapping (title first)

- **Extract BBD projection as importable module** — **`T-FR-0003-01`** ([`tickets.md`](tickets.md))
- **Add BBD projection REST API** — **`T-FR-0003-02`** ([`tickets.md`](tickets.md))
- **Deliver BBD projection page** — **`T-FR-0003-03`** ([`tickets.md`](tickets.md))
- **Validate BBD UX and document operator workflow** — **`T-FR-0003-04`** ([`tickets.md`](tickets.md))

## Suggested next step

Continue **`FR-0002`** budget entry implementation (**`tasks/ticket-progress.md` → Current focus**) or **`FR-0004`** closeout bookkeeping if that stream is merge-complete.

## Options

- **A.** Treat **`FR-0004`** immersive BBD as the next closeout if all tickets are VAL-done and PR is merged — align **`REGISTRY.md`**, feature **`README.md`**, and **`Parallel streams`**.
- **B.** Optional rename of illustrative **`data/seed-statements/ian.yaml`** noted in feature **`README.md`**.
- **C.** New **`FR-NNNN`** for unrelated product slices per **`REGISTRY.md`** **`next_id`**.
