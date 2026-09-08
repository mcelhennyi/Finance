---
name: "source-command-sync-skeleton"
description: "Syncs the .skeleton submodule and manifest-listed root files. See project skill sync-skeleton and .skeleton/INIT.MD."
---

# source-command-sync-skeleton

Use this skill when the user asks to run the migrated source command `sync-skeleton`.

## Command Template

# /sync-skeleton

Follow the Cursor project skill **`sync-skeleton`** (`.cursor/skills/sync-skeleton/SKILL.md`).

**Summary:** From the **project root**, run **`bash .skeleton/scripts/sync-skeleton.sh`**. That updates the **`.skeleton/`** submodule, applies **`.skeleton/DEPRECATED_PATHS`**, overwrites **root** paths from **`skeleton.manifest`** **except** lines in **`.skeleton/.syncignore`**, then idempotently migrates clean legacy ticket DAGs to plain-English labels/dependencies and a directly-below project/feature explanation while preserving ids/edges. It refuses to rewrite dirty DAGs. Review the staged migration, require **`python3 scripts/refresh_ticket_dags.py --root . --check`**, then **`git commit`**. Submodule-only boilerplate is never copied to the root (see **`.skeleton/docs/skeleton-consumer-root-layout.md`**).

**Required:** capture old pin (`git rev-parse HEAD:.skeleton`) before sync and
new integrated SHA afterward. Review `CHANGELOG.md` over exactly `old..new`
plus crossed release tags, applying only introduced/changed Consumer manual and
Deprecation instructions—not unrelated old Unreleased entries.

**Requested skeleton change:** follow the mirrored
**`orchestrator-controller`** rule: same `harness-update-<slug>` branch from the
exact fetched project and skeleton defaults; validate/changelog/push/integrate
the skeleton first; sync and integrate the exact reviewed project commit; then
merge project default into affected features before their next wave. Stop on
remote drift; immediately refetch and require the expected target tip to remain
unchanged and be an ancestor of the reviewed commit. Reconcile/revalidate drift;
use PR policy or an explicitly authorized normal fast-forward push only.

**Details:** **`.skeleton/INIT.MD`** → *Syncing template updates*.

## See also

- **`/feature-request`**, **init-skeleton** — **`.skeleton/INIT.MD`**
- **`bash .skeleton/push-skeleton contribute`** when pushing generic root changes upstream
