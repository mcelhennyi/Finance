---
description: >-
  Resume a feature request from tasks/feature-history/ (next design stage, ticket
  merge, or develop/finish prompts) without allocating a new FR-NNNN.
---

# /feature-request-continue

Follow **`.cursor/skills/feature-request/SKILL.md`**, resuming the **in-progress** `FR-NNNN` directory the user points to (default: the row in **`REGISTRY.md`** with status `design` or `in-progress`).

## Steps

1. Read **`tasks/feature-history/REGISTRY.md`** and the target **`tasks/feature-history/FR-NNNN-<slug>/README.md`**.
2. If the git checkout is on **`feat/*`**, read repo-root **`CURRENT.md`** next, then **`handoffs/`** (newest dated files first), **`serial-diary.md`**, **`parallel/*`**, and **`DIARY.md`** if present; otherwise open **`handoffs/`** first, then **`serial-diary.md`** / **`parallel/*`** / **`DIARY.md`**. Continue from the last incomplete **stage** (intake, design, tickets, develop prompts, closeout).
3. Do **not** allocate a new `FR-NNNN` unless the user says this is a **new** feature.
4. **End the reply** with **Executive summary**, **Suggested next step**, and **Options** when several paths are reasonable — **`feature-request`** skill **User-facing close (required)**.

## Compose

Same sub-commands as **`/feature-request`**: when implementation is in scope, use **`/identify-frontier`**, **`/develop-frontier`**, then **`/finish-feature`** or **`/finish-frontier`**, once tickets (**`T-FR-NNNN-xx`**) exist (**`docs/ai-context.md` §2d**). When summarizing work to the user, use **ticket titles** and link ids to **`tickets.md`** per the feature-request skill (**Human-readable names vs ticket ids**).
