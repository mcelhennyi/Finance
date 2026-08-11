---
description: >-
  Pre-ticket design readiness audit for a top-level design doc path: plain-English
  report of gaps, flaws, rework, growth, and deferrals before /feature-request.
---

# /audit-design

Follow the Cursor project skill **`.cursor/skills/audit-design/SKILL.md`**.

## Argument

One **top-level design doc** path (required), for example:

`/audit-design docs/design/genomic-analysis-desktop/README.md`

## What this is

- **Read-only** design review: map linked docs, scan escalation tags, score ticket-readiness, optional code-vs-design notes.
- **Output:** plain-English report with diagrams where helpful; optional save under **`tasks/design-audits/`**.
- **Does not** register **`FR-NNNN`**, write tickets, or implement code.

## End every turn for the user

End each response with **Executive summary**, **Suggested next step**, and **Options** when more than one reasonable path exists — see **`report-template.md`** in the skill folder.

## What runs next

When verdict is **Ready** (or **Caution** with accepted risks):

`/feature-request <same design doc path>`

## Compose (do not fork)

| Step | Command |
| --- | --- |
| Audit (this) | **`/audit-design`** |
| Intake + tickets | **`/feature-request`** |
| Parallel implementation | **`/identify-frontier`** → **`/develop-frontier`** (after tickets exist) |

**Development commands:** not required for audit; use **`./develop build`** only when verifying doc-site changes is in scope for the session.
