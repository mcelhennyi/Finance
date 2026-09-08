---
name: update-manual
description: >-
  Update the static HTML manual site under docs/manual by comparing the current
  code state to the last reviewed code hash recorded in docs/manual/update-log.html.
  Use when the user asks for /update-manual, asks to update manual docs, or when
  finish-feature delegates the feature-end manual refresh with fresh context.
---

# Update Manual

Update the project manual static site under **`docs/manual/`** so it factually
tracks the current code state.

## Inputs

Accept an optional scope:

- A feature id and slug, for example `FR-0017 ncbi-complete-genome-corpus-mirror`.
- A list of changed files, symbols, tickets, or directories.
- An explicit diff base hash.

If no scope is given, use the last reviewed hash in
**`docs/manual/update-log.html`**.

## Manual state

The update log is **`docs/manual/update-log.html`**. It must contain these
machine-readable meta tags in the document head:

```html
<meta name="manual:last-reviewed-code-hash" content="<commit-sha-or-UNINITIALIZED>">
<meta name="manual:last-reviewed-at" content="YYYY-MM-DD">
<meta name="manual:version" content="1">
```

The same values must be visible in the page body so humans can inspect the
state without reading HTML source.

If **`docs/manual/`** or the update log is missing, create a small static HTML
site with **`index.html`**, **`update-log.html`**, and **`manual.css`**. If the
hash is missing or `UNINITIALIZED`, use an explicit user-provided base when
available; otherwise use the merge-base with the remote default branch for
feature work, or record a bootstrap review against `HEAD`.

## Workflow

1. Resolve the review target:
   - `target_hash = git rev-parse HEAD`
   - `base_hash = <explicit base>` or `manual:last-reviewed-code-hash`
   - detect the default branch with `git symbolic-ref refs/remotes/origin/HEAD`
     when needed.
2. Inspect the diff:
   - run `git diff --name-status <base_hash>..HEAD -- . ':(exclude)docs/manual/**' ':(exclude)site/**'`
   - include `git diff --stat <base_hash>..HEAD` for scale;
   - include uncommitted code changes only when the user explicitly asks.
3. Read the changed implementation files, relevant tests, relevant design docs,
   and existing **`docs/manual/`** pages. Prefer `rg` and targeted file reads.
4. Update or create manual pages only where the diff changes purpose,
   workflows, commands, user-visible behavior, data contracts, operational
   steps, or important failure modes.
5. Reconsider the whole manual's information architecture every time content is
   added or materially changed:
   - review the manual homepage, page order, labels, and navigation;
   - group pages into directories when a concept set becomes cumbersome;
   - prefer conceptual paths that get readers to their goal quickly;
   - update all relative links, nav, and search metadata after any move.
6. If code and design docs disagree, do not silently rewrite design authority.
   Write the manual page to describe the current implementation as verified in
   code, and add a visible docs/code mismatch note with both references.
7. Update **`docs/manual/index.html`** navigation and page lists for any new
   page.
8. Update the fuzzy search assets, especially
   **`docs/manual/manual-search-index.js`**, so new, moved, or renamed pages are
   discoverable by title, summary, tags, and likely user intent.
9. Update **`docs/manual/update-log.html`**:
   - set the `manual:last-reviewed-code-hash` meta tag to `<target_hash>`;
   - set the `manual:last-reviewed-at` meta tag to `<today>`;
   - update the visible state values in the page body.
10. Append a dated changelog entry with:
   - reviewed hash,
   - previous hash,
   - diff scope,
   - manual pages changed or "no manual page changes",
   - information-architecture changes or "manual structure unchanged",
   - search-index changes,
   - reason for the update,
   - validation performed.

Always update the hash and append the log entry, even when the diff requires no
manual content changes.

## Page quality

Manual pages must be static HTML under **`docs/manual/`**:

- Use semantic HTML (`header`, `nav`, `main`, `section`, headings in order).
- Include **Purpose**, **How It Works**, **Key Files**, and **Last Verified**.
- Link to code, tests, design docs, tickets, and related manual pages.
- Keep claims anchored in the files read during the update.
- Avoid duplicating long design specs; link authoritative docs instead.
- Prefer diagrams or tables when they clarify flow, data shape, or ownership.
- Use local assets only; do not depend on external fonts, scripts, or CDNs.

## Search

Maintain local fuzzy search for the static site:

- Keep **`docs/manual/manual-search-index.js`** current with every page's title,
  URL, summary, and tags.
- Keep **`docs/manual/manual-search.js`** dependency-free and browser-native.
- Add the search input/results block to new page shells unless a page has a
  deliberate reason to omit the shared shell.
- Search should prioritize quick conceptual navigation, not exact file names
  only. Add synonyms and user-goal phrases to tags when useful.

## Static site styling

Use the project-level design language only when it is explicitly documented or
implemented in a reusable source. Examples include a named design system,
project style guide, shared CSS tokens, or a documented shell/component system.

If no project-level design language has been set, do not guess. Generate plain,
obviously unfinished static HTML:

- default system fonts;
- black text on white background;
- simple borders and browser-default spacing;
- a visible note near the top: "Manual style placeholder: project design
  language has not been set."

When a project design source exists, cite it in a comment at the top of
**`docs/manual/manual.css`** or in the generated page notes so future updates
can tell whether the styling is intentional.

## Finish-feature delegation

When invoked by **`finish-feature`**, run in a fresh subagent when delegation is
available. The subagent prompt should include the feature id, feature worktree,
feature branch, and instruction to run this skill against the feature code
changes. If subagents are unavailable, run this workflow inline and record the
exception in the finish-feature handoff.

## Validation

When manual pages or **`mkdocs.yml`** change, run the strongest docs-site check
available:

1. Prefer the repo wrapper, for example **`./develop build`**.
2. If no container path is available, use the documented host MkDocs fallback
   and record the exception.
3. At minimum, verify **`docs/manual/update-log.html`** has the new hash,
   **`docs/manual/manual-search-index.js`** references all manual pages, and no
   unresolved placeholders were introduced by this update.

## Final response

Report:

- The previous and new reviewed hashes.
- Manual pages changed, or that no manual pages changed.
- The reason recorded in the update log.
- Validation performed or why it could not run.
