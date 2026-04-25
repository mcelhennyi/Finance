---
description: >-
  Syncs the .skeleton submodule and manifest-listed root files. See project skill
  sync-skeleton and .skeleton/INIT.MD.
---

# /sync-skeleton

Follow the Cursor project skill **`sync-skeleton`** (`.cursor/skills/sync-skeleton/SKILL.md`).

**Summary:** From the **project root**, run **`./sync-skeleton`**. That updates the **`.skeleton/`** git submodule, applies **`.skeleton/DEPRECATED_PATHS`**, overwrites **root** paths from **`skeleton.manifest`**, and **stages** — you review and **`git commit`**.

**Details:** **`.skeleton/INIT.MD`** → *Syncing template updates (`./sync-skeleton`)*.

## See also

- **`/feature-request`**, **init-skeleton** (first-time materialization) — **`.skeleton/INIT.MD`**
- **`./push-skeleton contribute`** when pushing **generic** root changes back upstream (not the same as sync)
