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
| **`docs/design/EXPERTS.md`** | **`docs/design/EXPERTS.project.md`** |
| **`CLAUDE.md`** | *(prefer **`docs/ai-context.project.md`** for shared rules)* |
| **`AGENTS.md`** | *(prefer **`docs/ai-context.project.md`** + **`.codex/project.md`**)* |

### Codex-specific layout (`.codex/`)

| Path | Sync behavior |
| --- | --- |
| **`.codex/README.md`**, **`.codex/rules/**`** | Manifest-listed — refreshed on **`./sync-skeleton`** |
| **`.codex/project.md`** | Manifest-listed for **first init**; add to **`.syncignore`** at consumer root so local edits survive sync |

See **`.codex/README.md`**.

Rules:

1. **Do not** list **`*.project.*`** in **`skeleton.manifest`** as template sources under **`.skeleton/`** — consumers create them beside synced base files.
2. **`./sync-skeleton`** does **not** read, write, merge, or delete **`*.project.*`** files; they follow normal git workflow only.
3. Put durable **project-only** content in overlays. Keep the base file aligned with upstream skeleton changes; resolve conflicts by editing overlays, not by freezing the base file in **`.syncignore`** unless you intentionally opt out of template updates for that path.

The same **`NAME.project.EXT`** pattern applies to other single-file roots when useful, as long as the companion name is exactly **`NAME.project.EXT`** (insert **`.project.`** before the final extension). Expert-review rules explicitly load **`docs/design/EXPERTS.md`** and then **`docs/design/EXPERTS.project.md`** so project identities survive Skeleton sync.

## After every `sync-skeleton`

**`./sync-skeleton`** does not merge template text into **`*.project.*`** or
overwrite **syncignored** paths. The only narrow exception is an explicitly
documented in-place schema migration such as the idempotent ticket-DAG
readability/status refresh; it uses the consumer's own ticket data and preserves
stable ids/edges. After each run, use the script's recorded old and new
skeleton SHAs to review **`.skeleton/CHANGELOG.md`** over exactly `old..new`
plus crossed release sections. Apply only **`Consumer manual:`** /
**`[consumer manual]`** and Deprecation instructions introduced or changed in
that range. Maintainers add those bullets when template changes are only
partially automated.

## Agent behavior

**`docs/ai-context.md`** and **`.cursor/rules/main.mdc`** define session bootstrap: load the base file, then **`docs/ai-context.project.md`** **when it exists**, in that order. Section numbers (for example **§4**) in an overlay refer to the **base** **`docs/ai-context.md`** unless the overlay states otherwise.

**`CLAUDE.md`** instructs Claude Code to load **`docs/ai-context.project.md`** via the shared bootstrap in **`docs/ai-context.md`**.

**`AGENTS.md`** instructs Codex to load **`docs/ai-context.project.md`**, then **`.codex/rules/session.md`**, then **`.codex/project.md`** when present.

## Maintainer note (skeleton upstream)

When adding new **single-file** process docs to **`skeleton.manifest`**, document in the base file whether a **`*.project.*`** or **`.codex/project.md`** companion is expected and update this page if the pattern should apply.
