---
name: "source-command-feature-status"
description: "Explicit-only /feature-status command wrapper. Use only when the user directly invokes feature-status or explicitly requests its BLUF/progress-table format."
---

# source-command-feature-status

Use this skill only when the user explicitly invokes `/feature-status`, names
`$source-command-feature-status` / `$feature-status`, or directly asks to use
the feature-status command or its BLUF/progress-table format.

Do **not** infer this skill from an ordinary question about progress, completed
work, remaining work, allocation, blockers, or next steps. For those questions,
answer directly and, when a structured close is useful, use the project default:
**Executive summary**, **Details**, **Suggested next step**, and **Options** when
multiple reasonable paths exist.

## Command Template

# /feature-status

Follow the canonical project skill
**`.cursor/skills/feature-status/SKILL.md`**.

## Required outcome

- Resolve the feature first, then resolve and surface the absolute clickable
  path to its **`20-tickets-dag.md`**. Open it only through a genuinely exposed
  active-client/editor open-file capability; pin it only when a separate safe
  pin capability exists. Do not shell-launch a GUI or invent a URI/tool. Missing
  open/pin support or a missing DAG is non-blocking; report the expected path
  and continue.
- Return a standalone, two-to-four-sentence **BLUF** first.
- Give **Tickets left / total tickets** and **Waves left / total waves** as
  verified fractions immediately after the BLUF; use `unknown/unknown` rather
  than guessing when canonical evidence is incomplete.
- Follow with one status table containing **Done**, **Upcoming**, and applicable
  **Blocked** and **Skipped** rows.
- Give each item a **Low**, **Medium**, or **High** complexity signal.
- Use verified outcomes and plain English; do not count planned or unverified
  work as done.
- Reply in the conversation unless the user asks for a saved artifact.
