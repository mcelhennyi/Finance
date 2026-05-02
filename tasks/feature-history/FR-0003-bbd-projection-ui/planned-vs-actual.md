# Planned vs actual — FR-0003 (`bbd-projection-ui`)

**Feature id:** **`FR-0003`**  
**Canonical ticket definitions:** [`tickets.md`](tickets.md)  
**DAG / index:** [`docs/design/tickets-initial.md`](../../../docs/design/tickets-initial.md) ( **`T-FR-0003-xx`** )

## Baseline (plan)

Originally scoped in [`00-intake.md`](00-intake.md), [`10-design-00-skeleton.md`](10-design-00-skeleton.md), and **`T-FR-0003-01` … `T-FR-0003-04`** in [`tickets.md`](tickets.md): packaged simulation module, **`POST /api/bbd-projection/run`**, SPA page with disclaimers + schedule/MC output, operator docs in **`scripts/README.md`**.

**Workflow note:** The first tranche landed on **`master`** without preserving a distinct remote **`feat/FR-0003-<slug>`** integration branch — see historical note in [`README.md`](README.md). This **`planned-vs-actual`** captures a **later follow-up** delivered on **`feat/FR-0003-bbd-ui-followup`** (**PR link** in feature README).

## Actual outcome (feat/FR-0003-bbd-ui-followup)

Consolidates UX, API parity, and tests not fully expressed in original ticket stubs:

| Area | What merged | Ticket mapping |
|------|-------------|----------------|
| Backend YAML default | **`GET /api/bbd-projection/default-scenario`**, env **`FINANCE_BBD_DEFAULT_YAML`**, `PyYAML` dependency, hydrate path in engine | **`T-FR-0003-02`** / **`T-FR-0003-04`** extensions (fixture + operator ergonomics). |
| Schemas / engine | Pydantic + engine alignment with nested scenario fields used by the SPA; extended tests (`tests/test_api_bbd_projection.py`, `tests/test_finance_bbd_engine.py`) | **`T-FR-0003-01`** / **`02`** hardened. |
| SPA | Structured form + presets (**`localStorage`**), **`OutputHoverTip`**, results copy; modal guide (**`BbdDocsProvider`** / **`BbdGuideContent`**), anchored deep-links, persisted modal scroll (**`bbdDocAnchors.ts`**); floating lower-right launcher; removal of standalone **`bbd-guide`** route | **`T-FR-0003-03`** + **`T-FR-0003-04`**. |
| Seed / compose | Mounted **`./data/seed-statements`** and default **`data/seed-statements/ian.yaml`** (illustrative sample — not individualized advice); companion **`ian.toml`** for parity tests where used | **`T-FR-0003-04`**. |

**No tickets deferred** within this FR slice other than unrelated streams (**`FR-0002`** budget work remains independent).

## Delta (summary)

Original tickets did not enumerate: **modal-only** operator guide UX, **`localStorage`** scroll restore vs contextual anchor opens, **`GET` default scenario** hydration, or the **floating** launcher. **`10-design-00-skeleton.md`** was amended to capture these interfaces.

## Documentation traceability mapping

| Design / history artifact | Ships as |
|---------------------------|----------|
| [`10-design-00-skeleton.md`](10-design-00-skeleton.md) | API + SPA surfaces (including **`GET /api/bbd-projection/default-scenario`**, modal guide, launcher). Updated in this milestone. |
| [`tickets.md`](tickets.md) | Canonical ids **`T-FR-0003-01`**–**`04`**; follow-up satisfies remaining UX acceptance for **`03`**/**`04`** without renaming tickets. |
| [`scripts/README.md`](../../../scripts/README.md) | Existing operator workflow (delegation to **`finance.bbd`**); unchanged by this milestone unless diary notes edits. |

**Published MkDocs (`mkdocs.yml`):** No BBD SPA pages were added to the static docs site for this milestone; the SPA remains the interactive surface (**documented limitation** for auditors relying on MkDocs-only exports).
