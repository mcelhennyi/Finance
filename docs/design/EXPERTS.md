# Design expert roster

This Skeleton-owned base roster defines the shape of `EXPERT:<slug>` entries
used by [`EXPERT-REVIEW`](expert-review.md) annotations. Put real project
experts in `docs/design/EXPERTS.project.md`; that companion is project-owned and
is loaded after this file. Do not list an expert without their knowledge.

| Expert tag | Display name or role | Contact route | GitHub reviewer | Protected paths | Backup / escalation | Status |
|---|---|---|---|---|---|---|
| `EXPERT:example` | `<name or accountable role>` | `<email, chat handle, or team>` | `@<github-user-or-team>` | `<comma-separated paths or globs>` | `<backup expert or repository owner>` | `inactive-example` |

Create the overlay with the same table columns:

```markdown
# Project design expert roster

| Expert tag | Display name or role | Contact route | GitHub reviewer | Protected paths | Backup / escalation | Status |
|---|---|---|---|---|---|---|
| `EXPERT:security` | Security lead | `<contact>` | `@<reviewer>` | `docs/design/security/**, src/auth/**` | Repository owner | `active` |
```

## Roster rules

- Use a short, stable, lowercase slug after `EXPERT:`. Prefer domain names such
  as `security` or `data-governance`, not a person's name.
- **Protected paths** are repository-root-relative review hints. Keep the syntax
  compatible with the project's review tooling and explain any non-obvious
  scope below the table. The PR workflow also maps semantic effects that cross
  those path boundaries.
- The display name or accountable role and contact route must let the human
  identify whom the agent is talking about. The GitHub reviewer must be usable
  when PR review is the approval path.
- `active` rows require scoped approval immediately before final merge to the
  default branch. An `inactive` row should name a usable backup or escalation;
  otherwise the default-branch PR records an unresolved mapping.
- Multiple applicable tags all require approval at that final merge gate.
- A project roster change is itself reviewed under the currently active row at
  the final default-branch merge gate. Follow
  [expert-review.md](expert-review.md) and preserve approval evidence.
- A repository-owner backup may approve through the documented escalation path,
  but that approval never grants an agent authority to merge the PR.

## Optional scope notes

Add human-readable explanations to `EXPERTS.project.md` when path patterns alone
do not explain a domain boundary. Keep product-specific names and decisions in
that overlay rather than this Skeleton-wide base file.
