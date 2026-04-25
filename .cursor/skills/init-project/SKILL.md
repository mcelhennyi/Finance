---
name: init-project
description: >-
  After clone + ./init-skeleton, applies human answers (name, charter, branch,
  traceability prefix) at the project root without importing product fiction.
  Use when starting a new repository from INIT.MD or when the user says
  init-project, new repo from skeleton, or post-skeleton customization.
---

# Init project (from skeleton)

## When to use

The user has (or will) run **`./init-skeleton`** from a **clone of the skeleton** so that **`.skeleton/`** is a submodule and template files are copied to the **repo root** (`INIT.MD`). This skill covers **customization** of that layout: names, charter, prefix, optional stack notes — **not** re-copying the whole tree by hand unless `init-skeleton` was skipped.

## Preconditions

- **Preferred:** `.skeleton/` exists as a **git submodule** and root files mirror **`skeleton.manifest`** (see **`INIT.MD`**).
- If the user only has a flat copy of template files (no submodule), follow **`INIT.MD`** legacy guidance or have them run **`init-skeleton`** from a clean skeleton clone before heavy customization.

## Required inputs (ask if missing)

1. **Project name** — human-readable title for `README.md`.
2. **Repository slug** — directory or remote name (team convention).
3. **One-line charter** — what this repository is for (no fictional product detail).
4. **Default branch** — usually `main`; confirm.
5. **License / visibility note** — informational only; do not invent legal text.

## Desired inputs (use defaults if absent)

6. **Stack** — languages and versions (agent **must not** add heavy scaffold until the user confirms stack choices).
7. **CI target** — e.g. GitHub Actions, none yet.
8. **Docs stack** — e.g. none, MkDocs, other.
9. **Traceability prefix** — replaces **`PROJ`** in `@PROJ-<AREA>-<NUMBER>` examples (three to six uppercase alnum, team-defined).
10. **Worktrees** — default: keep `.worktrees/` in `.gitignore`; feature worktrees live at `.worktrees/FR-NNNN-<slug>/feature/`, with ticket/stage child worktrees under the same feature folder.

## Steps

### 1. Confirm layout

- If **`.skeleton/`** is missing or not a submodule, tell the user to run **`./init-skeleton`** from a skeleton clone first (see **`INIT.MD`**), then re-run this skill.
- Do **not** delete or rewrite **`.skeleton/`** except via normal git operations the user requests.

### 2. Apply answers (edit repo root only)

Update minimally at the **project root** (not inside `.skeleton/` unless contributing upstream):

- **`README.md`** — generate from **`README.template.md`** if needed, then fill in project name, charter, and placeholders for build/test once stack exists. Do not copy the skeleton repository's own **`README.md`** over a project README.
- **`develop.conf` (from `develop.conf.example`)** — set **`DEVELOP_LABEL`** to the project name. If the repo has **`compose.yaml`**, set **`DEVELOP_DOCS_SERVICE`**, **`DEVELOP_COMPOSE_FILE`**, and **`DEVELOP_DOCS_PORT`** to match the service that runs MkDocs (defaults: **`docs`**, **`compose.yaml`**, **`8000`**). If there is no Docker/Compose for docs, omit the file; **`./develop local`** still uses **`scripts/serve-docs.sh`** when present.
- **`docs/design/architecture/overview.md`** — keep placeholder or insert user bullets if provided.
- **`docs/design/documentation-style.md`** — replace **`PROJ`** with the chosen traceability prefix in examples.
- **`docs/ai-context.md`** — same prefix in the traceability section.
- **`.claude/rules/development-standards.md`** — same prefix if it references `@PROJ-`.

Do **not** add domain-specific requirements the user did not supply.

### 3. Optional: `.skeleton-upstream` for contribute

If the user named a **local path** to the skeleton **source** checkout used with **`./push-skeleton contribute`**, offer to create **`.skeleton-upstream`** (one absolute path per line). Never push without their explicit request.

### 4. Stack scaffolding gate

- If languages are listed but scaffold was not requested: document intent in **`README.md`** and **`T-FR-0000-01`** notes only.
- If they explicitly asked to scaffold: add minimal **truthful** config plus **`.cursor/rules/stack-conventions.mdc`** with `alwaysApply: true` and real bullets.

### 5. Remind about product workflow

- New **`FR-NNNN`** efforts: use the **`feature-request`** skill (or **`/feature-request`**) per **`.cursor/skills/feature-request/SKILL.md`** — then **`/identify-frontier`**, **`/develop-frontier`**, **`/finish-feature`** or **`/finish-frontier`** once **`tickets.md`** exists (**`docs/ai-context.md` §2b–§2d**).

### 6. Remind about sync

- Tell the user to run **`./sync-skeleton`** after upstream skeleton releases (pulls submodule, applies **`DEPRECATED_PATHS`**, refreshes manifest files at root).

### 7. Close the loop

- Remind them to **`git add`**, **`git commit`**, and point **`origin`** at their remote if still set to the skeleton URL.

## Anti-patterns

- Re-“materializing” by copying from **`.skeleton/`** over user-edited root files without a **`sync-skeleton`** discussion (sync is the supported path).
- Importing product docs or secrets from unrelated repos.
- Adding **`skeleton.manifest`** entries for application source paths.

## Checklist before done

- [ ] `README.md` reflects real project name and charter.
- [ ] `develop.conf` (if used) matches Compose service name / ports or was intentionally skipped.
- [ ] Ticket **`T-FR-0000-01`** still matches “choose stack” or was intentionally updated.
- [ ] Traceability examples use the chosen prefix consistently in root docs.
- [ ] User knows to use **`./sync-skeleton`** for template updates and deprecations.
- [ ] User knows new product work flows through **`feature-request`** + frontier skills (**`docs/ai-context.md` §2b–§2d**).
