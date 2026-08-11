---
name: "source-command-executive-summary"
description: "Create a concise, plain-English, BLUF-first executive-summary Markdown artifact with Git and evidence traceability for a project or task."
---

# source-command-executive-summary

Use this skill when the user asks to run the migrated source command
`executive-summary` or requests a durable project/task executive summary.

## Command Template

# /executive-summary

Follow the canonical project skill
**`.cursor/skills/executive-summary/SKILL.md`**.

## Required outcome

- Save the summary only under **`tasks/executive-summaries/`**.
- Put **Bottom Line Up Front** first.
- Use the required local timestamp, source commit, branch, scope, and evidence
  metadata.
- Run the bundled verifier and return a clickable link to the saved Markdown.
