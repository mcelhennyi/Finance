---
name: "source-command-explain-and-document"
description: "Explain the purpose or behavior of a requested code path, workflow, feature, command, or system behavior and write it into docs/manual as a static HTML wiki page. Use only for explicit /explain-and-document requests, not as a general rule."
---

# source-command-explain-and-document

Use this skill when the user asks to run the migrated source command
`explain-and-document`, or explicitly asks to explain something and document it
in the manual.

## Command Template

# /explain-and-document

Follow the Cursor project skill
**`.cursor/skills/explain-and-document/SKILL.md`**.

## What this is

- Explains a requested topic from code and docs evidence.
- Writes or updates a static HTML wiki-style page under **`docs/manual/`**.
- Links the page from **`docs/manual/index.html`** and, when needed,
  **`mkdocs.yml`**.
- Reconsiders manual format, order, grouping, and directory structure before
  saving the page.
- Updates the local fuzzy search index.
- Updates **`docs/manual/update-log.html`** with the current code hash and reason.

## What this is not

It is not a general rule that every explanatory answer must update the manual.
Only run it for explicit **`/explain-and-document`** or equivalent user
requests.
