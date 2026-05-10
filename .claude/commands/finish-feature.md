---
description: >-
  Merges feature-prefixed ticket/stage branches into feat/FR-NNNN-slug, validates,
  opens PR to main for human review; never auto-deletes remote branches. See skill
  finish-feature.
---

# /finish-feature

Follow the Cursor project skill **`finish-feature`** (`.cursor/skills/finish-feature/SKILL.md`).

**Summary:** For one **`FR-NNNN`**, merge all feature-prefixed ticket/stage branches **into** **`feat/FR-NNNN-<slug>`** from the feature worktree at **`.worktrees/FR-NNNN-<slug>/feature/`**, run checks, push **`feat/…`**, and **`gh pr create`** (or update PR) **base `main`**, **head `feat/…`** — **only** when integrating a **completed feature** (all agreed tickets merged into **`feat/…`**). Do **not** push **`main`** or delete remote branches unless the user explicitly directs otherwise.

## See also

- **`/develop-frontier`**, **`/finish-frontier`**, **`/feature-request`**
- **`docs/ai-context.md`** §2d
