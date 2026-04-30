---
description: >-
  Resume a feature request from tasks/feature-history/ (next design stage, ticket
  merge, or develop/finish prompts) without allocating a new FR-NNNN.
---

# /feature-request-continue

Follow **`.cursor/skills/feature-request/SKILL.md`**, resuming the **in-progress** `FR-NNNN` directory the user points to (default: the row in **`REGISTRY.md`** with status `design` or `in-progress`).

## Steps

1. **Integration PR reality check (run first when merge might be stale):** If the target feature’s **`README.md`**, **`90-closeout.md`**, **`tasks/ticket-progress.md` → Current focus**, or newest **`handoffs/*.md`** still point at merging an open PR, **`git fetch`** and **verify** the PR is not already merged on the remote default branch (`main` / `master` / team convention) **before** suggesting “merge the PR”. Use **`gh pr view …`** or **`git log origin/<default>`** as in **`.cursor/skills/feature-request/SKILL.md` → `/feature-request-continue` and integration PR hygiene**. If already merged, apply that section’s bookkeeping (registry **`complete`**, drop root **`CURRENT.md`**, refresh **`ticket-progress.md`**, update feature docs) so the session does not repeat an obsolete merge step.
2. Read **`tasks/feature-history/REGISTRY.md`** and the target **`tasks/feature-history/FR-NNNN-<slug>/README.md`**.
3. If the git checkout is on **`feat/*`**, read repo-root **`CURRENT.md`** next, then **`handoffs/`** (newest dated files first), **`serial-diary.md`**, **`parallel/*`**, and **`DIARY.md`** if present; otherwise open **`handoffs/`** first, then **`serial-diary.md`** / **`parallel/*`** / **`DIARY.md`**. Continue from the last incomplete **stage** (intake, design, tickets, develop prompts, closeout).
4. Do **not** allocate a new `FR-NNNN` unless the user says this is a **new** feature.
5. **End the reply** with **Executive summary**, **Suggested next step**, and **Options** when several paths are reasonable — **`feature-request`** skill **User-facing close (required)**.

## Compose

Same sub-commands as **`/feature-request`**: when implementation is in scope, use **`/identify-frontier`**, **`/develop-frontier`**, then **`/finish-feature`** or **`/finish-frontier`**, once tickets (**`T-FR-NNNN-xx`**) exist (**`docs/ai-context.md` §2d**). When summarizing work to the user, use **ticket titles** and link ids to **`tickets.md`** per the feature-request skill (**Human-readable names vs ticket ids**).
