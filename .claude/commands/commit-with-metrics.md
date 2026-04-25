---
description: Commit staged changes with a footer that records AI token/cost and feature time, labeled as documented, estimated, recorded, or derived. Use when the user wants to commit with usage metrics, cost notes, or effort time in the message.
---

# /commit-with-metrics

Follow **`.cursor/skills/commit-with-ai-metrics/SKILL.md`** (same workflow as this command).

**Rules:** Do not invent metrics; use DOCUMENTED / ESTIMATED / UNKNOWN for tokens and cost; RECORDED / ESTIMATED / DERIVED for time. Place a `---` section **Metrics (AI assistance & effort)** after the technical commit body.

Show `git diff --cached --stat` and the proposed message before committing when the user expects review.
