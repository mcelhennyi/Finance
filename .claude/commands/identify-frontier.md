---
description: >-
  Writes tasks/handoffs/YYYY-MM-DD-parallel-frontier.md from ticket-progress,
  tasks/feature-history/**/tickets.md, and tickets-initial DAG. For full steps,
  follow the project skill identify-frontier.
---

# /identify-frontier

Follow the Cursor project skill **`identify-frontier`** (`.cursor/skills/identify-frontier/SKILL.md`).

**Summary:** Read `docs/ai-context.md`, `tasks/ticket-progress.md`, and **all** **`tasks/feature-history/**/tickets.md`** (**Deps:** under each `### T-FR-NNNN-xx` heading; use **`TICKET-SOURCES.md`** + glob). Skim **`docs/design/tickets-initial.md`** for the **global DAG** / **`triadDone`** only. Mark tickets **eligible** when every dependency has **VAL** = `done`. The **parallel-capable** set is **eligible ∩ incomplete** (triad not all `done`) — **global** across all tickets; it may mix **`T-FR-NNNN-xx`** from **different** **`FR-NNNN`** features when **Deps** allow (**`docs/ai-context.md` §2c**). Write `tasks/handoffs/YYYY-MM-DD-parallel-frontier.md` using the skill’s template (queue snapshot, parallel table, blocked examples, process note, cross-cutting, next steps). If inputs are **very large**, use a **subagent** to scan or summarize per **`docs/ai-context.md` §1b**.

If the user wants output only in chat, say so and omit the file.
