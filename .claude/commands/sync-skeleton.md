---
description: >-
  Syncs the .skeleton submodule and manifest-listed root files. See project skill
  sync-skeleton and .skeleton/INIT.MD.
---

# /sync-skeleton

Follow the Cursor project skill **`sync-skeleton`** (`.cursor/skills/sync-skeleton/SKILL.md`).

**Summary:** From the **project root**, run **`bash .skeleton/scripts/sync-skeleton.sh`**. That updates the **`.skeleton/`** submodule, applies **`.skeleton/DEPRECATED_PATHS`**, overwrites **root** paths from **`skeleton.manifest`** **except** lines in **`.skeleton/.syncignore`**, and **stages** — you review and **`git commit`**. Submodule-only boilerplate is never copied to the root (see **`.skeleton/docs/skeleton-consumer-root-layout.md`**).

**Required after the script:** Read **`.skeleton/CHANGELOG.md`** — **After sync: read the changelog**, **`Consumer manual:`** / **`[consumer manual]`**, and **Deprecations**.

**Details:** **`.skeleton/INIT.MD`** → *Syncing template updates*.

## See also

- **`/feature-request`**, **init-skeleton** — **`.skeleton/INIT.MD`**
- **`bash .skeleton/push-skeleton contribute`** when pushing generic root changes upstream
