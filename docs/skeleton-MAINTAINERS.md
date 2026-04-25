# Maintaining the skeleton repository

This document applies when **this repository is the canonical skeleton** (the empty file **`SKELETON_REPO`** exists at the **root of this git checkout**). Consumer projects created with **`./init-skeleton`** remove that marker from their **outer** root so only the nested **`.skeleton/`** submodule copy keeps it.

## On every commit that changes the template

1. Update **`CHANGELOG.md` → `[Unreleased]`** with a clear bullet under **Template** describing what changed and why.
2. If you **delete, rename, or stop shipping** a path that consumers may still have at **their repo root**, add the old path to **`DEPRECATED_PATHS`** (one line per path) and add a matching bullet under **Deprecations** in **`CHANGELOG.md`**.
3. If you add a new template file consumers should receive, add **`source|dest`** to **`skeleton.manifest`** (same relative path on both sides is usual).

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
3. Overwrites files listed in **`skeleton.manifest`** from `.skeleton/` into the consumer root.
