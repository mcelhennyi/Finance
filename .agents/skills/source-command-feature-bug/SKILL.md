---
name: "source-command-feature-bug"
description: >-
  Continuously log, same-FR ticket, and TEST→DEV→VAL a manual-test or operator
  bug in its own subagent lane while the parent remains available.
---

# source-command-feature-bug

Use this skill when the user asks to run the migrated source command
`feature-bug`, or says to log a feature bug / pre-PR manual-test issue.

## Command Template

# /feature-bug

Follow the Cursor project skill **`.cursor/skills/feature-bug/SKILL.md`**.

## What this is

- Assigns every distinct report to its own subagent lane: write it under
  **`bugs/`**, allocate its same-FR solving ticket/DAG through
  **`/expand-feature`**, then run TEST→DEV→VAL through **`/develop-frontier`**.
- Resolves **`FR-NNNN`** from an explicit id, the current worktree/branch, or
  **`CURRENT.md`**.
- Keeps the parent free for more intake. Serialize shared id/DAG planning;
  parallelize dependency-safe, file-disjoint ticket work. Only an explicit
  log-only request stops before implementation.

## Required close

Tell the user each exact report path, solving ticket, lane/worktree, and current
TEST / DEV / VAL state.
