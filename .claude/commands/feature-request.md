---
description: >-
  End-to-end feature request: FR-NNNN registry, layered design, tickets + DAG,
  then optional /identify-frontier, /develop-frontier, /finish-feature (default)
  or /finish-frontier. Resume with /feature-request-continue.
---

# /feature-request

Follow the Cursor project skill **`.cursor/skills/feature-request/SKILL.md`**.

## What this is

- **Not** a replacement for `identify-frontier` / `develop-frontier` / `finish-feature` / `finish-frontier`.
- A **product-sized** flow: **intake** → **interface-first design** (skeleton, then depth as needed) → **`20-tickets-dag.md`** (Jira/Asana-friendly markdown, Mermaid DAG) → **prompt** to implement → **`/develop-frontier`** when tickets (**`T-FR-NNNN-xx`**) are in the tracker → **prompt** to **`/finish-feature`** (or **`/finish-frontier`** if integrating straight to **`main`**).
- For **large** features, use **subagents early** per **`docs/ai-context.md` §1b** (e.g. per subsystem design or codebase survey) before consolidating artifacts.
- **Parallel features:** several **`FR-NNNN`** may be in flight; each has its own **`tasks/feature-history/FR-…/`** directory. **`/develop-frontier`** still batches tickets (**`T-FR-NNNN-xx`**) from the **global** graph — see **`docs/ai-context.md` §2c** and **`tasks/ticket-progress.md` → Parallel streams**.
- **Human-readable naming:** In prompts, diaries, and handoffs, lead with each ticket’s **title** from **`tickets.md`**; use the **`T-FR-NNNN-xx`** id with a **link** to the canonical **`###`** section for detail (full rule in **`.cursor/skills/feature-request/SKILL.md` → Human-readable names vs ticket ids**).

## Compose with existing commands (do not fork behavior)

1. **Before develop:** land tickets (**`T-FR-NNNN-xx`**) in **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**, **`tasks/feature-history/TICKET-SOURCES.md`**, **`docs/design/tickets-initial.md`** (DAG index), and **`tasks/ticket-progress.md`** (or a PR-ready “Proposed patch” in `20-tickets-dag.md` if you cannot commit yet).
2. **Parallel handoff (optional, recommended):** `/identify-frontier`
3. **Implement:** `/develop-frontier` (feature worktree at **`.worktrees/FR-NNNN-<slug>/feature/`**; ticket/stage child worktrees under the same feature folder)
4. **Integrate:** `/finish-feature` (default; feature branch → **PR to `main`**) or `/finish-frontier` (direct **`main`**)

**Doc site during design / VAL:** when **`docs/`** or **`mkdocs.yml`** change, use **`./develop help`** and run **`./develop up`** (Docker Compose) or **`./develop local`** (venv on the host); use **`./develop build`** for a static check. Optional **`develop.conf`**; see root **`README.md`** and **`.cursor/skills/feature-request/SKILL.md`** (local dev / Docker section).

## “Identify” disambiguation

- Spoken **identify (FR)** in the lifecycle = **register `FR-NNNN` + write intake** in `tasks/feature-history/`.
- `/identify-frontier` = **parallel tickets** (`T-FR-NNNN-xx`) from the ticket graph; run **only after** tickets exist.

## Artifacts and registry

- Allocate **`FR-NNNN`** in **`tasks/feature-history/REGISTRY.md`**; never reuse an id. **Push that registry change (and minimal feature stub) to `main` immediately** so concurrent features deconflict on a single source of truth.
- All stage notes in **`tasks/feature-history/FR-NNNN-<slug>/`**: `serial-diary.md` (serial), **`parallel/*.md`** (per parallel subagent), **`handoffs/*.md`** (continue / milestone / closeout — **canonical** for this feature), optional **`DIARY.md`** (merged newest-first stack). Closeout recap in **`90-closeout.md`**; optional short pointer in **`tasks/handoffs/`** only.

**Templates:** `.cursor/skills/feature-request/reference-templates.md`
