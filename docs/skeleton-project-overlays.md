# Project-specific overlays next to skeleton-synced files

Consumer repositories refresh **process** files from **`.skeleton/`** with **`./sync-skeleton`**. Paths listed in **`skeleton.manifest`** are overwritten at the **repo root** on each sync **unless** the same path appears in **`.skeleton/.syncignore`**.

That model is ideal for **generic** template text but poor for **long-lived, repository-only** rules (extra **VAL** gates, stack-specific commands, org policy). For those, use **companion overlay files**.

## Naming convention

For any repo-root file **`DIR/NAME.EXT`** that **`sync-skeleton`** copies from the template (manifest source, not syncignored), you may add an optional second file at:

**`DIR/NAME.project.EXT`**

Examples:

| Base file (from template; may be overwritten on sync) | Project-owned companion (never touched by **`sync-skeleton`**) |
|------------------------------------------------------|-------------------------------------------------------------------|
| **`docs/ai-context.md`** | **`docs/ai-context.project.md`** |
| **`CLAUDE.md`** | **`CLAUDE.project.md`** |

Rules:

1. **Do not** list **`*.project.*`** paths in **`skeleton.manifest`** — they are not template sources under **`.skeleton/`**.
2. **`./sync-skeleton`** does **not** read, write, merge, or delete **`*.project.*`** files; they follow normal git workflow only.
3. Put durable **project-only** content in the **`.project.`** file. Keep the base file aligned with upstream skeleton changes; resolve conflicts by editing overlays, not by freezing the base file in **`.syncignore`** unless you intentionally opt out of template updates for that path.

The same pattern applies to other single-file roots when useful, as long as the companion name is exactly **`NAME.project.EXT`** (insert **`.project.`** before the final extension).

## After every `sync-skeleton`

**`./sync-skeleton`** does not merge template text into **`*.project.*`** files. After each run, **read** **`.skeleton/CHANGELOG.md`**: use **After sync: read the changelog (consumers and agents)** at the top of that file, then **`[Unreleased]` → Template** for **`Consumer manual:`** / **`[consumer manual]`** bullets that tell you what to port into this overlay (or into other repo-specific files). Maintainers add those bullets when template changes are only partially automated.

## Agent behavior

**`docs/ai-context.md`** and **`.cursor/rules/main.mdc`** define session bootstrap: load the base file, then the **`.project.`** file **when it exists**, in that order. Section numbers (for example **§4**) in an overlay refer to the **base** **`docs/ai-context.md`** unless the overlay states otherwise.

**`CLAUDE.md`** instructs Claude Code to load **`CLAUDE.project.md`** after the base file when present.

## Maintainer note (skeleton upstream)

When adding new **single-file** process docs to **`skeleton.manifest`**, document in the base file whether a **`*.project.*`** companion is supported and update this page if the pattern should apply.
