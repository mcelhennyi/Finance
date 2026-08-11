---
name: "source-command-feature-status"
description: "Give a concise plain-English feature status with a BLUF and a table of done, upcoming, blocked, and skipped work with rough complexity signals."
---

# source-command-feature-status

Use this skill when the user asks to run the migrated source command
`feature-status` or asks what is done, what remains, or where a feature stands.

## Command Template

# /feature-status

Follow the canonical project skill
**`.cursor/skills/feature-status/SKILL.md`**.

## Required outcome

- Return a standalone, two-to-four-sentence **BLUF** first.
- Follow with one status table containing **Done**, **Upcoming**, and applicable
  **Blocked** and **Skipped** rows.
- Give each item a **Low**, **Medium**, or **High** complexity signal.
- Use verified outcomes and plain English; do not count planned or unverified
  work as done.
- Reply in the conversation unless the user asks for a saved artifact.
