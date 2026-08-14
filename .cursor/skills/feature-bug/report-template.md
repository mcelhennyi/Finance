# Bug report templates

Ids are **feature-local**: **`BUG-FR-NNNN-xx`**. They are **not** a
`tasks/TAG-REGISTRY.md` family. Tickets stay **`T-FR-NNNN-xx`** and are
allocated only by **`/expand-feature`**.

## `bugs/README.md`

```markdown
# FR-NNNN bugs

Manual-test and operator reports for this feature. **`/feature-bug`** appends
rows. **`/expand-feature`** (bug-fix expansion) tickets open rows and writes
**Solving ticket** back into each report.

**next_id:** `1`

| Id | Title | Kind | Status | Solving ticket |
|----|-------|------|--------|----------------|
```

**Status:** `open` → `ticketed` → `done`. **Solving ticket** stays empty until
expand-feature writes **`T-FR-NNNN-xx`**.

## `bugs/BUG-FR-NNNN-xx-<short-slug>.md`

```markdown
# BUG-FR-NNNN-xx — <short title>

| Field | Value |
|-------|--------|
| **Id** | `BUG-FR-NNNN-xx` |
| **Date** | YYYY-MM-DD |
| **Feature** | `FR-NNNN` (`<slug>`) |
| **Kind** | `code-defect` \| `layout` \| `design-conflict` \| `product-follow-up` |
| **Status** | `open` |
| **Surface** | UI route / dialog / API / sidecar method |
| **Branch / worktree** | `feat/FR-NNNN-<slug>` at `.worktrees/...` |
| **Environment** | ports, compose project, browser vs Electron |
| **Solving ticket** | _(empty until /expand-feature)_ |

## Seen

Numbered repro. Include query text, which row/control, and what happened.

## Expected

What should happen, citing design/mock when known (`docs/design/...`,
`10-design-*.md`, mock HTML).

## Actual

What happened instead.

## Design notes

Does current spec agree with Expected? Quote the clause. If this is specified
behavior, say so and keep **Kind** as `product-follow-up` or explain the
conflict.

## Likely seam

Files, components, IPC methods, or CSS selectors a later ticket should inspect.
Unknown is allowed; do not invent a root cause.

## Evidence

URLs, screenshot paths, log lines, run ids. No secrets or PII.

## Ticket seed

Facts a later **`T-FR-NNNN-xx`** must preserve:

- **In plain English:**
- **Why this exists:**
- **Out of scope:**
- **Done when (plain English):**
- **Acceptance sketch:**
```

When **`/expand-feature`** tickets the bug, it updates **Status** to `ticketed`,
sets **Solving ticket** to **`T-FR-NNNN-xx`**, links the **`30-expand-*`**
addendum, and later sets **Status** to `done` when that ticket’s VAL is `done`.
It also amends **`docs/design/`** (and mocks/manual as needed) when the fix
would otherwise leave docs untruthful.
