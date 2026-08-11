---
name: "source-command-code-tour"
description: "Create an interactive, self-contained HTML tour for a scoped area of code: hot path, anchored code excerpts, diagrams, error handling, tests, and docs-vs-code mismatches."
---

# source-command-code-tour

Use this skill when the user asks to run the migrated source command
`code-tour`.

## Command Template

# /code-tour

Follow the Cursor project skill **`.cursor/skills/code-tour/SKILL.md`**.

## Argument

A code scope is required. Examples:

- `/code-tour apps/web/src/auth`
- `/code-tour "login flow"`
- `/code-tour T-FR-0007-04`
- `/code-tour native/genomic-compute-sidecar/src/specificity_analysis.cpp docs/design/genomic-analysis-desktop/specificity-analysis.md`

## What this is

- Produces a self-contained HTML file under
  **`tasks/code-tours/YYYY-MM-DD-<slug>.html`**.
- Explains the implementation in plain English, with the high-level hot path
  first.
- Anchors explanations in code paths, symbols, and line ranges.
- Uses tabs, sections, diagrams, tables, code cards, and other rich layout
  where useful.
- Separates non-hot paths, error handling, contracts/data shapes, and tests.
- Explicitly calls out docs-vs-code mismatches.

## What this is not

- It does not change implementation code.
- It does not replace ticket workflow or design amendments.
- It does not silently resolve docs/code disagreement; it reports the mismatch.

## End every turn for the user

Return the generated HTML file link, the covered scope, any docs/code
mismatches, and the validation performed on the artifact.
