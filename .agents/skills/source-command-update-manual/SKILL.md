---
name: "source-command-update-manual"
description: "Update the static HTML manual under docs/manual by diffing the current code state against the last reviewed hash in docs/manual/update-log.html, then update manual pages and the hash/log. Used by /update-manual and finish-feature manual refresh."
---

# source-command-update-manual

Use this skill when the user asks to run the migrated source command
`update-manual`, asks to update the manual, or when **`finish-feature`**
delegates the feature-end manual refresh.

## Command Template

# /update-manual

Follow the Cursor project skill **`.cursor/skills/update-manual/SKILL.md`**.

## What this is

- Diffs current code against **`docs/manual/update-log.html`**
  `manual:last-reviewed-code-hash`.
- Reads changed code, tests, relevant design docs, and existing manual pages.
- Updates static HTML pages under **`docs/manual/`** when code behavior, purpose, workflow,
  commands, data contracts, or operational notes changed.
- Reconsiders manual format, order, grouping, and directory structure on every
  content update so readers can reach goals quickly.
- Updates the local fuzzy search index.
- Updates the reviewed hash and appends a changelog entry even when no manual
  page changes are needed.

## Finish-feature use

When called from **`/finish-feature`**, run with fresh context via a subagent
when available. If subagents are unavailable, run inline and record that
exception in the finish-feature handoff.
