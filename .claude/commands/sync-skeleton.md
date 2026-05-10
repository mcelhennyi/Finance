---
description: >-
  Syncs the .skeleton submodule and manifest-listed root files. See project skill
  sync-skeleton and .skeleton/INIT.MD.
---

# /sync-skeleton

Follow the Cursor project skill **`sync-skeleton`** (`.cursor/skills/sync-skeleton/SKILL.md`).

**Summary:** From the **project root**, run **`./sync-skeleton`**. That updates the **`.skeleton/`** git submodule, applies **`.skeleton/DEPRECATED_PATHS`**, overwrites **root** paths from **`skeleton.manifest`** **except** lines in **`.skeleton/.syncignore`**, lists any present **`*.project.*`** overlays (see **`docs/skeleton-project-overlays.md`**), and **stages** — you review and **`git commit`**. Greenfield **`./init-skeleton`** already copied the syncignored paths once from the template.

**Required after the script:** Read **`.skeleton/CHANGELOG.md`** — start with **After sync: read the changelog (consumers and agents)**, then **`[Unreleased]` → Template** (look for **`Consumer manual:`** / **`[consumer manual]`**) and **Deprecations**. Port or merge anything the script did not apply (overlays, syncignored files, customized **`develop`**, etc.).

**Details:** **`.skeleton/INIT.MD`** → *Syncing template updates (`./sync-skeleton`)*.

## See also

- **`/feature-request`**, **init-skeleton** (first-time materialization) — **`.skeleton/INIT.MD`**
- **`./push-skeleton contribute`** when pushing **generic** root changes back upstream (not the same as sync)
