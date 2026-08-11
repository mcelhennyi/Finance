---
name: sync-skeleton
description: >-
  Updates the .skeleton git submodule and copies template files from .skeleton/ to
  the project root per skeleton.manifest, applies DEPRECATED_PATHS, and stages
  changes. Use when the user asks to sync the skeleton, run sync-skeleton, pull
  template updates, refresh from .skeleton, or after upstream skeleton changes.
---

# Sync skeleton

Canonical procedure: **`.skeleton/INIT.MD` → § "Syncing template updates"**.

## Preconditions

- **Git repo root** with **`.skeleton/`** as an **initialized submodule**. If missing, run **`bash .skeleton/scripts/init-skeleton.sh`** first (see **`.skeleton/INIT.MD`**).

## Init vs sync

- **`init-skeleton`** and **`sync-skeleton`** both skip paths in **`.skeleton/.syncignore`**. Submodule-only boilerplate (CHANGELOG, INIT.MD, wrappers, manifest, …) stays under **`.skeleton/`** only — see **`docs/skeleton-consumer-root-layout.md`**.
- **Project overlays:** **`NAME.project.EXT`** beside synced **`NAME.EXT`** are never touched by sync.

## Steps

1. **`cd`** to repository root.
2. **Run:** `bash .skeleton/scripts/sync-skeleton.sh`
3. **Read** **`.skeleton/CHANGELOG.md`** (required) — **`Consumer manual:`** / **`[consumer manual]`** bullets and **Deprecations**.
4. **Report** `git status`; human **`git commit`** when satisfied.

## See also

- **`.skeleton/docs/skeleton-consumer-root-layout.md`**
- **`.skeleton/skeleton.manifest`**, **`.skeleton/.syncignore`**, **`.skeleton/DEPRECATED_PATHS`**
