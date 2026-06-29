---
name: code-tour
description: >-
  Create an interactive, self-contained HTML code tour for a requested code
  scope. Use when the user asks for /code-tour, a code walkthrough, an
  implementation tour, or a readable substitute for manually tracing code.
---

# Code Tour

Create a plain-English, evidence-backed, interactive HTML tour for a scoped
implementation area.

## Argument

A code scope is required. Accept any useful combination of:

- File paths or directories.
- Symbols, routes, commands, features, tickets, or user workflows.
- Optional docs/spec paths to compare against the implementation.

If the scope is ambiguous, inspect the repo first and make a conservative
assumption. Ask only when multiple unrelated systems match and choosing one
would make the tour misleading.

## Output

Write a self-contained HTML file under:

`tasks/code-tours/YYYY-MM-DD-<slug>.html`

Also create the directory when missing. The HTML must work from disk without a
dev server or external network resources. Use embedded CSS and small embedded
JavaScript for tabs, filters, collapsible sections, or search.

## Required content

The tour must let a reader understand the implementation without first reading
the code:

1. **Executive map** — what the scoped code does, the files involved, and how
   the pieces fit together.
2. **High-level hot path** — the main runtime flow in order, written in plain
   English and anchored to specific files, symbols, and line ranges.
3. **Code blocks of interest** — short excerpts with file path and line range.
   Explain why each block matters and what assumptions it encodes.
4. **Interactive structure** — use tabs, sections, accordions, side navigation,
   diagrams, tables, or other layout features to separate:
   - hot path,
   - supporting/non-hot paths,
   - error handling,
   - data/contracts,
   - tests/validation,
   - docs-vs-code notes.
5. **Diagrams or rich representations** — include flow diagrams, dependency
   maps, state tables, sequence timelines, data-shape tables, or inline SVG
   when they clarify the implementation. Prefer simple self-contained HTML/SVG.
6. **Non-hot paths of interest** — background jobs, alternate branches, caching,
   retries, validation, cleanup, migrations, feature flags, or edge-case flows.
7. **Error handling** — show where errors originate, how they are classified or
   transformed, and what reaches callers/users.
8. **Docs-vs-code audit** — compare relevant design docs, README sections, or
   tickets when present. Explicitly call out any mismatch. If no relevant docs
   are found, say so in the report.
9. **Tests and confidence** — name the tests or validation commands that cover
   the hot path and important edge paths. If coverage is missing, say what is
   unproven.

## Evidence rules

- Anchor every substantive explanation in code: file path + symbol/function
  name where available + line range.
- Prefer `rg`, existing tests, type definitions, schemas, and structured code
  navigation over broad manual browsing.
- Keep excerpts short and focused. Do not paste whole files.
- If docs and code disagree, the report must include a visible
  **Docs/code mismatch** callout with both references.
- Do not silently infer behavior from names alone. Confirm behavior in code or
  label it as an inference.

## Workflow

1. Read repo process files when needed (`AGENTS.md`, `docs/ai-context.md`) and
   respect local code/documentation authority rules.
2. Map the scope:
   - collect candidate files with `rg --files`, `rg <symbol>`, and test names;
   - identify entry points, callers, callees, contracts, and tests;
   - identify relevant docs/specs/tickets.
3. Trace the hot path from entry point to outcome. Record line ranges for each
   step.
4. Trace non-hot paths: validation, failure handling, alternate branches,
   persistence/cache, side effects, and cleanup.
5. Compare docs/specs to code. Record mismatches or note that no mismatch was
   found.
6. Build the HTML:
   - include title, generation date, requested scope, and repo/branch when
     available;
   - include a sticky navigation or tab bar;
   - include code excerpt cards with line anchors;
   - include diagrams/tables where useful;
   - include a "How to read this tour" note only if the layout is non-obvious.
7. Validate the artifact:
   - ensure the HTML file exists and is non-empty;
   - search it for unresolved placeholders such as `TODO`, `TBD`, or
     `FIXME` unless those appear in quoted source code;
   - if practical, open or render it and check that tabs/sections work.

## HTML expectations

Use accessible, readable defaults:

- Semantic HTML with headings in order.
- Responsive layout that works on narrow screens.
- Good contrast and readable monospace blocks.
- No external fonts, scripts, or stylesheets.
- Escape all code snippets correctly.
- Add small controls only when they help the reader: tabs, accordions, filters,
  copy buttons, or source toggles.

## Final response

Return:

- The generated HTML path as a clickable file link.
- The scope covered.
- Any docs/code mismatches found.
- Validation performed on the artifact.
