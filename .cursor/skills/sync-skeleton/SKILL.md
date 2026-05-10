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
- **Project overlays:** companion files **`NAME.project.EXT`** beside manifest-synced **`NAME.EXT`** (for example **`docs/ai-context.project.md`**) are **never** touched by **`sync-skeleton`**; put repo-only process rules there. See **`docs/skeleton-project-overlays.md`**.

## Steps

1. **Working directory:** `cd` to the repository root (`git rev-parse --show-toplevel`).
2. **Run:** `./sync-skeleton`  
   - If the wrapper is missing, run **`bash .skeleton/scripts/sync-skeleton.sh`** (same behavior once `.skeleton` is present and initialized), or copy **`sync-skeleton`** from **`.skeleton/`** to the root per **`INIT.MD`**.  
   - The script updates the submodule, applies **`DEPRECATED_PATHS`**, copies **`skeleton.manifest`** paths (skipping **`.syncignore`**), prints hints for any **`*.project.*`** overlays, **`git add`s** results, and prints a reminder to read the changelog. It does **not** merge template guidance into overlays, syncignored files, or customized tooling — that is **manual / agent** work.

3. **Read `.skeleton/CHANGELOG.md` (required):** Follow **After sync: read the changelog (consumers and agents)** at the top of that file. Review **`[Unreleased]` → Template** for bullets starting **`Consumer manual:`** or **`[consumer manual]`**, and any other bullets that imply porting or reconciling changes. Read **`Deprecations`** when present. If the submodule advanced across a **tagged release**, scan that release’s **Template** / **Deprecations** too. Apply subjective updates (**`*.project.*`**, **syncignored** trackers, local **`develop`**, **`.gitignore`**, etc.) before treating the sync as complete.

4. **Report:** show **`git status`** (short). Remind the human to **`git commit`** when satisfied.

5. **Do not** silently discard local edits: if status shows unexpected changes, call them out; resolving conflicts is human-led unless the user directs otherwise.

## See also

- **`.skeleton/CHANGELOG.md`** — **required reading after sync**; **Format reference** explains **`Consumer manual:`** / **`[consumer manual]`** for maintainers.
- **`.skeleton/INIT.MD`** — full bootstrap vs sync, **`init-skeleton`**, environment variables, **`push-skeleton contribute`**.
- **`.skeleton/skeleton.manifest`** — which paths sync considers; **`.skeleton/.syncignore`** — consumer paths sync skips after greenfield **`init-skeleton`**; **`DEPRECATED_PATHS`** — deletions on sync.
- **`docs/skeleton-project-overlays.md`** — **`*.project.*`** companion files for repo-specific rules beside template-synced files.
