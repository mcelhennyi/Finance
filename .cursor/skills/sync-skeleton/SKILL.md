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
- **Ticket-DAG migration:** product-owned DAG files remain syncignored from
  template copying, but sync runs the idempotent ticket-DAG refresher after the
  new tooling lands. It refuses to rewrite dirty DAGs; commit, stash, or
  reconcile those files and rerun.

## Steps

1. **`cd`** to repository root.
2. **Record old pin:** `git rev-parse HEAD:.skeleton`.
3. **Run:** `bash .skeleton/scripts/sync-skeleton.sh`, then record the new
   integrated SHA with `git -C .skeleton rev-parse HEAD`. The sync automatically
   backfills clean legacy DAGs to plain-English labels/dependencies, preserves
   stable ids/edges, refreshes lifecycle colors, and adds the directly-below
   project/feature **Where things stand** explanation; review every generated
   DAG staged by the script.
4. **Review the exact changelog range:** inspect
   `git -C .skeleton diff <old>..<new> -- CHANGELOG.md`; list crossed release
   tags with `git -C .skeleton tag --merged <new> --no-merged <old>` and review
   those release sections. Apply only Consumer manual and Deprecation
   instructions introduced or changed in `old..new`, not unrelated pre-existing
   Unreleased entries.
5. **Verify** `python3 scripts/refresh_ticket_dags.py --root . --check`, then
   report `git status`; human **`git commit`** when satisfied.

## Requested upstream skeleton changes

When the user requests a skeleton/harness change rather than only consuming an
existing release, follow **`.cursor/rules/orchestrator-controller.mdc`**:

1. Create `harness-update-<slug>` in an isolated project worktree from the
   exact fetched project remote default.
2. Create the same branch inside the initialized submodule from the exact
   fetched skeleton remote default.
3. Change, validate, changelog, commit, push, and safely integrate the skeleton
   branch first.
4. Run this sync procedure from the project harness branch, review the exact
   old-pin..new-integrated changelog range and crossed releases, validate
   mirrors/docs, commit and push that branch, then
   safely integrate its exact reviewed commit to the project default.
5. Merge the updated project default into affected active features before their
   next wave; never rewrite shared feature history.

For each default-branch integration, immediately refetch and record the expected
remote tip. Require it to remain unchanged and be an ancestor of the exact
reviewed harness commit. On drift, reconcile in the isolated branch, re-read
changed authority, revalidate, refetch, and retry. Use a reviewed PR/project
policy, or an explicitly authorized normal fast-forward push only. Never force
or blindly publish a non-fast-forward update.

## See also

- **`.skeleton/docs/skeleton-consumer-root-layout.md`**
- **`.skeleton/skeleton.manifest`**, **`.skeleton/.syncignore`**, **`.skeleton/DEPRECATED_PATHS`**
