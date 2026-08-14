---
description: >-
  Record a manual-test or operator bug against an existing FR-NNNN under
  tasks/feature-history/FR-NNNN-<slug>/bugs/. Use when the user says
  /feature-bug, feature bug, or logs pre-PR manual-test issues.
---

# /feature-bug

Follow the Cursor project skill **`.cursor/skills/feature-bug/SKILL.md`**.

## What this is

- Logs one or more bug reports in the target feature’s **`bugs/`** directory
  with enough detail to create a later **`T-FR-NNNN-xx`**.
- Resolves **`FR-NNNN`** from an explicit id, the current worktree/branch, or
  **`CURRENT.md`**.
- Does **not** allocate tickets. After every issue is ingested, use
  **`/expand-feature`** to ticket and fix outstanding bugs and to point each
  report at its solving ticket.

## Required close

Tell the user the **exact repo-relative path** of every report written, plus
id, feature, and kind.
