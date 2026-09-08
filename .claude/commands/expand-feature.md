---
description: >-
  Expand the current FR-NNNN as a sub-feature/addendum: capture a new
  addition/change, deeply design it inside the feature-history folder, append
  same-FR tickets/DAG/tracker rows when warranted, and optionally continue into
  /identify-frontier and /develop-frontier.
---

# /expand-feature

Follow the Cursor project skill **`.cursor/skills/expand-feature/SKILL.md`**.

## What this is

- A **same-feature expansion** flow: resolve the target **`FR-NNNN`**, capture
  the new request, write a dedicated
  **`tasks/feature-history/FR-NNNN-<slug>/30-expand-YYYY-MM-DD-<short-slug>.md`**
  addendum, expand **`tickets.md`** and **`20-tickets-dag.md`**, update
  **`tasks/ticket-progress.md`** and **`docs/design/tickets-initial.md`**, then
  optionally run **`/identify-frontier`** / **`/develop-frontier`**.
- Preserve the canonical Mermaid graph at the top of **`20-tickets-dag.md`**;
  after ticket/tracker edits run **`python3 scripts/refresh_ticket_dags.py --root
  .`**, then **`--check`**. Review plain-English visible labels/dependencies,
  stable ids/edges, completed green, in-development yellow, outstanding red,
  and the generated project/feature explanation of no more than three sentences
  directly below the graph.
- Scale the process to the ask: simple UI adjustments use a dedicated
  worktree/branch plus focused validation and a docs HTML mock, while involved
  additions expand same-FR tickets and use parallel frontier work when possible.
- It **does not allocate a new `FR-NNNN`** unless the addition fails the natural
  fit test or the user explicitly asks for a new feature.
- New tickets continue the existing feature sequence, e.g.
  **`T-FR-0006-08`** after **`T-FR-0006-07`**.
- Completed tickets are historical: create follow-up tickets for rework instead
  of silently changing done ticket scope.
- **Continuous bug-fix expansion:** assign one subagent lane and one same-FR
  solving ticket per report; serialize shared id/DAG planning, then run
  dependency-safe TEST→DEV→VAL lanes in parallel without waiting for all bugs
  or the current wave. Keep docs/mocks/manual truthful. See
  **`.cursor/skills/expand-feature/SKILL.md` → Continuous bug-fix lanes**.
- When mocking an additional UI feature, update the current UI if possible as
  the example and save the HTML under **`docs/design/mockups/`**.

## Required close

End each response with **Executive summary**, **Suggested next step**, and
**Options** when more than one reasonable path exists, following the
**`feature-request`** skill.

## Compose

After expansion tickets exist, use the normal feature workflow:
**`/identify-frontier`** to recompute the global eligible set,
**`/develop-frontier`** to implement one ticket per child worktree, and
**`/finish-feature`** only after every original and expansion ticket for the
feature satisfies **`docs/ai-context.md` section 2d**.
