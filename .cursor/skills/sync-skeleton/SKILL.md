---
name: sync-skeleton
description: >-
  Updates the .skeleton git submodule and copies template files from .skeleton/ to
  the project root per skeleton.manifest, applies DEPRECATED_PATHS, and stages
  changes. Use when the user asks to sync the skeleton, run sync-skeleton, pull
  template updates, refresh from .skeleton, or after upstream skeleton changes.
---

# Sync skeleton

Canonical procedure: **`.skeleton/INIT.MD` → § "Syncing template updates"** (`./sync-skeleton`).

## Preconditions

- **Git repo root** (where **`.skeleton/`** exists as a **initialized submodule**). If the user has never run **`./init-skeleton`**, do that first (see **`.skeleton/INIT.MD`**).
- **`./sync-skeleton`** at repo root, or the script copied from the submodule (see below).

## Init vs sync (greenfield)

- **`./init-skeleton`** copies **every** **`skeleton.manifest`** path from **`.skeleton/`** to the repo root once; it does **not** consult **`.syncignore`**. That seeds registry / ticket / DAG stubs and other starter files for **greenfield** repos.
- **`./sync-skeleton`** skips paths in **`.skeleton/.syncignore`** so later runs only refresh **tooling** (skills, rules, scripts, etc.) and do not overwrite product-specific root files. See **`.skeleton/INIT.MD`** → *Syncing template updates*.

## Steps

1. **Working directory:** `cd` to the repository root (`git rev-parse --show-toplevel`).
2. **Run:** `./sync-skeleton`  
   - If the wrapper is missing, run **`bash .skeleton/scripts/sync-skeleton.sh`** (same behavior once `.skeleton` is present and initialized), or copy **`sync-skeleton`** from **`.skeleton/`** to the root per **`INIT.MD`**.

The script, in order:

1. Fast-forwards the **`.skeleton/`** submodule (`git pull` or **`git submodule update --remote .skeleton`** if needed).
2. Removes paths listed in **`.skeleton/DEPRECATED_PATHS`** from the **project root** only.
3. Overwrites **root** files listed in **`skeleton.manifest`** with copies from **`.skeleton/`**, **except** paths in **`.skeleton/.syncignore`** (and refreshes the **`init-skeleton` / `sync-skeleton` / scripts** shims the script also copies).
4. **`git add`** submodule pointer and updated files — **staged**, not committed.

3. **Report:** show **`git status`** (short). Remind the human to **review** (merge conflicts on customized root files are possible) and **`git commit`** when satisfied.
4. **Do not** silently discard local edits: if status shows unexpected changes, call them out; resolving conflicts is human-led unless the user directs otherwise.

## See also

- **`.skeleton/INIT.MD`** — full bootstrap vs sync, **`init-skeleton`**, environment variables, **`push-skeleton contribute`**.
- **`.skeleton/skeleton.manifest`** — which paths sync considers; **`.skeleton/.syncignore`** — consumer paths sync skips after greenfield **`init-skeleton`**; **`DEPRECATED_PATHS`** — deletions on sync.
- **`.skeleton/CHANGELOG.md`** — template changes (maintainers).
