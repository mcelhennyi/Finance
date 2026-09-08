---
description: Explicit-only /feature-status report with ticket/wave progress and Done/Upcoming/Blocked/Skipped work.
---

# /feature-status

Run this command only when the user explicitly invokes `/feature-status` or
directly requests its exact format. Ordinary progress, allocation, blocker,
completion, and next-step questions use the default **Executive summary**,
**Details**, **Suggested next step**, and **Options** close when structure helps.

Follow the canonical project skill
**`.cursor/skills/feature-status/SKILL.md`**.

After resolving the feature, open its absolute **`20-tickets-dag.md`** path
through the active client/editor only when a real open-file capability exists;
pin it only when a separate safe pin capability exists. Never shell-launch a
GUI or invent a tool/URI. Opening or pinning failure is non-blocking, and the
response must always include the absolute clickable DAG link (or report the
expected absolute path when the file is missing).
