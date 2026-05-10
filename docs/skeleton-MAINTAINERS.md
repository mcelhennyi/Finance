# Maintaining the skeleton repository

This document applies when **this repository is the canonical skeleton** (the empty file **`SKELETON_REPO`** exists at the **root of this git checkout**). Consumer projects created with **`./init-skeleton`** remove that marker from their **outer** root so only the nested **`.skeleton/`** submodule copy keeps it.

## On every commit that changes the template

1. Update **`CHANGELOG.md` → `[Unreleased]`** with a clear bullet under **Template** describing what changed and why.
2. If you **delete, rename, or stop shipping** a path that consumers may still have at **their repo root**, add the old path to **`DEPRECATED_PATHS`** (one line per path) and add a matching bullet under **Deprecations** in **`CHANGELOG.md`**.
3. If you add a new template file consumers should receive, add **`source|dest`** to **`skeleton.manifest`** (same relative path on both sides is usual).
4. If consumers cannot get the full intent from **manifest file copies alone** — for example new **§** text in **`docs/ai-context.md`** they should mirror into **`docs/ai-context.project.md`**, new **`develop`** flags they merged locally, or **syncignored** files that need a manual diff — add a **Template** bullet prefixed **`Consumer manual:`** or **`[consumer manual]`** per **Format reference** in **`CHANGELOG.md`**. Agents and humans run **`./sync-skeleton`** then read those bullets; undescribed gaps invite guesswork.

## On push

- Prefer **`git pull --rebase`** on your branch before pushing.
- Ensure **`CHANGELOG.md`** reflects all template-affecting commits in the push (squash/reword locally if needed so the log stays honest).

## Hooks

From this repository root (once per clone):

```bash
git config core.hooksPath .githooks
```

The **pre-commit** hook refuses template-affecting commits that do not stage **`CHANGELOG.md`**.

## Consumer sync

Downstream projects run **`./sync-skeleton`**, which:

1. Fast-forwards the **`.skeleton/`** submodule.
2. Deletes paths listed in **`.skeleton/DEPRECATED_PATHS`** from the **consumer root** (not from inside `.skeleton/`).
3. Overwrites files listed in **`skeleton.manifest`** from **`.skeleton/`** into the consumer root, **except** paths listed in **`.skeleton/.syncignore`** (exact repo-root-relative lines). Use **`.syncignore`** for registry, ticket progress, global DAG, architecture overview, and other files that stay in **`skeleton.manifest`** for **initial** seeding but must not be overwritten on every sync.

When adding a new **`skeleton.manifest`** pair that consumers will customize, add the **consumer-side** path to **`.skeleton/.syncignore`** and document it under **`CHANGELOG.md` → Template**.

### Greenfield (`init-skeleton`) vs ongoing (`sync-skeleton`)

- **`./init-skeleton`** (first-time materialization) copies **all** **`skeleton.manifest`** pairs to the consumer root **without** applying **`.syncignore`**, so new repos get registry stubs, ticket trackers, starter DAG files, and a minimal **`.gitignore`** in one shot.
- **`./sync-skeleton`** applies **`.syncignore`**: only manifest-listed paths **not** ignored are overwritten. Product-owned files stay stable while skills, rules, scripts, and other tooling continue to update from the template.

### Project overlays (`*.project.*`)

For **process** files that consumers still want to refresh from the template on every sync, **do not** put durable repo-only text only in **`.syncignore`** (that freezes the base file). Prefer the companion pattern documented in **`docs/skeleton-project-overlays.md`**: consumers add **`NAME.project.EXT`** beside **`NAME.EXT`**; **`sync-skeleton`** never writes the **`.project.`** file. When you add a new manifest-synced single-file process doc, state in the template whether a **`*.project.*`** companion is expected.
