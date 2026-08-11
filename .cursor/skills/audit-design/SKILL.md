---
name: audit-design
description: >-
  Pre-ticket design readiness audit for a top-level design doc: plain-English
  report of gaps, flaws, rework, growth triggers, deferrals, and ticket
  blockers. Use when the user runs /audit-design, asks to audit a design before
  feature-request, or wants a go/no-go check before FR-NNNN ticketing.
disable-model-invocation: true
---

# Design audit (pre–feature-request)

**Purpose:** Read a **top-level design doc** (and its linked design children), then produce a **plain-English readiness report** so humans know what to **fix**, **address**, **defer/ignore**, or **accept** before running **`/feature-request`** on the same doc.

**This skill does not:** register **`FR-NNNN`**, write tickets, amend design silently, or implement code. Those belong to **`/feature-request`** and normal development.

**Runs before:** **`/feature-request <same design doc path>`** when the design is meant to drive implementation ticketing.

## User-facing close (required)

End every audit reply (and any saved report’s closing section) with:

1. **Executive summary** — verdict (**Ready** / **Caution** / **Blocked** for ticketing) and the top 3 findings.
2. **Suggested next step** — one primary action (e.g. resolve two **`DESIGN-GAP`** items, then **`/feature-request`**).
3. **Options** — only when multiple reasonable paths exist (**A**, **B**, …).

Template: **[report-template.md](report-template.md)**.

## Input

The user supplies **one path** to a **top-level** design document, for example:

- `docs/design/genomic-analysis-desktop/README.md`
- `docs/design/architecture/overview.md`

If the path is missing, ambiguous, or not under **`docs/design/`**, ask once for the canonical path; do not guess.

## Workflow

### 1. Bootstrap context

Read (as needed, not verbatim dump):

- **`docs/ai-context.md`** — docs authority, amendment process, escalation tags.
- **`.cursor/rules/docs-authority-and-escalation.mdc`** — and project mirrors **`REWORK-REQUIRED`**, **`GROWTH`**, **`REFINEMENT`** when present.
- **`docs/design/documentation-style.md`** — traceability, tag formats, expected doc shape.
- **`tasks/TAG-REGISTRY.md`** — if the design references numbered ids, verify they appear reserved/allocated (flag **orphan ids** or **missing registry rows**).

For **large** design trees, use **subagents** per **`docs/ai-context.md` §1b** (e.g. one subagent per child doc), then **merge** into one report.

### 2. Map the design tree

1. Read the **top-level** doc end-to-end.
2. Collect **all linked child docs** in the same design family (relative links, “see also”, index tables, nested `docs/design/...` paths). Read each child that specifies behavior, interfaces, persistence, algorithms, or IPC.
3. Note **external** references (research docs, trade studies, tickets) but do not deep-audit unrelated product areas unless they are **hard dependencies** for this feature.

Build a **doc map** (bulleted list or small diagram) for the report: top doc → children → status.

### 3. Scan for escalation and conditional tags

Search the mapped docs (and grep the repo for cross-references to those paths) for:

| Tag | Report bucket |
| --- | --- |
| **`DESIGN-GAP`** | **Fix before tickets** — blocks guessing |
| **`DESIGN-FLAW`** | **Fix before tickets** — needs design amendment |
| **`REWORK-REQUIRED`** | **Address** — code/doc diverges from settled design |
| **`GROWTH`** | **Defer with trigger** — ship v0 per doc; list trigger + upgrade |
| **`REFINEMENT`** | **Defer** if v0 path is still clear; else **Address** |
| Open **algorithm / scientist questions** (e.g. **`algorithm-questions.md`**) | **Fix** or **Address** per row (unresolved = ticket risk) |

List each hit with: **id** (if any), **one-line plain English**, **owning file**, **recommended action**.

Do **not** invent new **`DG-` / `RW-` / `GR-`** ids during audit; if you discover a gap that needs an id, say “reserve in **`TAG-REGISTRY.md`** before editing design” and describe the gap in prose.

### 4. Ticket-readiness checklist

For each **major component** named in the top-level doc (store, engine, UI shell, IPC, persistence, etc.), score in plain English:

| Dimension | Question |
| --- | --- |
| **Scope** | Is in-scope vs out-of-scope explicit enough to write acceptance criteria? |
| **Interfaces** | APIs, IPC, file layouts, and error contracts specified or **`DESIGN-GAP`**? |
| **Data / state** | Ownership, lifecycle, persistence, and migration paths clear? |
| **Algorithms** | Correctness criteria, complexity/scale limits, and v0 vs upgrade paths stated? |
| **Security / privacy** | What must not be logged or sent over IPC? |
| **Testing** | How would VAL prove compliance (integration points, golden data, diagnostics)? |
| **Dependencies** | Ordering between subsystems obvious for a ticket DAG? |
| **Traceability** | **`@LZ-…`** or equivalent links present where the project requires them? |
| **UI look and feel** (visible UI only) | Linked **HTML mocks** under **`docs/design/mockups/`** that match the spec, or documented waiver? For additions to existing UI, do mocks show the change in the current UI context when possible? |

Mark each component: **Ready**, **Needs design work**, or **Unknown**. For **UI shell / screens**, missing mocks when layout is specified → **Needs design work** (often **Blocked** for ticketing).

### 5. Code and doc reality (optional but recommended)

If implementation already exists for this design area:

- Skim **`apps/`**, **`native/`**, or paths cited in the design.
- Note **mismatches** (design says X, code does Y). Classify as **`REWORK-REQUIRED`** candidate (design is target) vs **`CODE-DEFECT`** (only if design is clearly correct and code is simply wrong — rare in pre-ticket audit).
- Do **not** treat mock/stub UI as “done” unless the design says v0 includes mocks.
- **HTML design mocks** in **`docs/design/mockups/`** are the visual acceptance reference for UI work — see **`.cursor/rules/ui-design-mockups.mdc`**. Implementation-only UI without linked mocks is not ticket-ready.

### 6. Verdict

| Verdict | Meaning |
| --- | --- |
| **Ready** | No open **`DESIGN-GAP`** / **`DESIGN-FLAW`**; **`REWORK-REQUIRED`** and unresolved scientist questions are documented with an accepted plan; a ticket DAG is plausible. |
| **Caution** | Some **Address** or **Defer** items remain; **`/feature-request`** may proceed if the user accepts called-out risks in intake. |
| **Blocked** | One or more **Fix before tickets** items would force implementation guesses. |

State verdict once at the top of the report and again in **Executive summary**.

### 7. Diagrams

Add **Mermaid** or ASCII only when they reduce confusion:

- Doc tree / dependency graph between design files.
- Subsystem boundaries and data flow when interfaces are the main gap.
- Ticket-phase dependency sketch **only** as illustrative (final DAG is **`/feature-request`**).

Keep diagrams small; prefer one clear figure over many.

### 8. Optional artifact

If the audit is non-trivial, write:

`tasks/design-audits/YYYY-MM-DD-<short-slug>-audit.md`

Use **[report-template.md](report-template.md)**. Link the top-level design path at the top. Commit only when the user asks to commit.

## Compose with other commands

| After audit | Command |
| --- | --- |
| Design gaps closed; verdict **Ready** or accepted **Caution** | **`/feature-request`** with the **same** top-level design doc |
| Parallel implementation later | **`/identify-frontier`** → **`/develop-frontier`** (only after tickets exist) |

**Template sync:** Keep **`.cursor/skills/`** and **`.claude/commands/`** aligned — **`.cursor/rules/cursor-claude-doc-sync.mdc`**.

## What not to do

- Do not register **`FR-NNNN`** or write **`tickets.md`** sections.
- Do not silently edit design docs to “pass” the audit.
- Do not implement product code during audit.
- Do not block on **`./develop build`** unless the user asked for doc-site verification; mention doc build as optional **Suggested next step** when **`docs/`** changed recently.
