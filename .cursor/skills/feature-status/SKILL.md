---
name: feature-status
description: >-
  Give a concise, plain-English status update for a project feature, including
  a BLUF, tickets-left and waves-left fractions, verified completed outcomes,
  remaining work, blockers, intentionally skipped work, and a rough complexity
  signal for each item. Use when the user asks for feature status, a progress
  update, what is done, what is left, where a feature stands, or what comes
  next. Return the update in the conversation unless the user asks for a saved
  artifact.
---

# Feature Status

Explain the feature's current state so a reader can understand it without
knowing the repository, ticket system, or internal vocabulary.

## Workflow

1. Resolve the feature from the user's name or id. If none is supplied, infer
   it from `CURRENT.md`, `tasks/ticket-progress.md`, and
   `tasks/feature-history/REGISTRY.md`. Ask only when more than one feature is
   plausibly in scope.
2. Inspect direct evidence before describing status. Prefer the feature's
   `README.md`, `tickets.md`, `90-closeout.md`, current handoff, tracker rows,
   relevant code and tests, and Git state. Verify remote or pull-request state
   when it changes whether work is actually delivered.
3. Reconcile plans with implementation and validation. Treat work as done only
   when the available evidence supports it. Classify implemented-but-unverified
   or unmerged work as **Upcoming**, work that cannot proceed as **Blocked**,
   and intentionally deferred or excluded work as **Skipped**.
4. Group related technical tickets into user-visible outcomes. Keep useful ids
   in parentheses after the plain-English description rather than making the
   reader decode them.
5. Calculate both progress fractions from the same verified evidence:
   - **Tickets left / total tickets:** Count canonical `### T-FR-NNNN-xx`
     tickets for the feature. A ticket remains until TEST, DEV, and VAL are all
     `done` in `tasks/ticket-progress.md`.
   - **Waves left / total waves:** Prefer the feature's documented dependency
     waves in `20-tickets-dag.md` or the latest frontier handoff. If waves are
     not named, derive stable topological layers from the canonical ticket
     dependencies. A wave remains while any ticket assigned to it remains.
   Reconcile duplicate or stale tracker rows against canonical `tickets.md`.
   If either fraction cannot be established from consistent evidence, show
   `unknown/unknown` for that fraction and explain the missing evidence briefly.
6. Return the compact structure below. Do not create or modify a project file
   unless the user explicitly requests a saved artifact.

## Output contract

```markdown
# Feature status: <plain-English feature name>

## BLUF

<Two to four sentences stating what the feature is for, what is done, what is
left, and any material blocker or decision.>

**Progress:** Tickets left **<remaining>/<total>** · Waves left **<remaining>/<total>**

## Status

| State | Work item | Complexity | Context |
|---|---|---|---|
| Done | <Completed outcome> | <Low|Medium|High> | <Why it matters or what was verified> |
| Upcoming | <Remaining outcome> | <Low|Medium|High> | <What remains and any dependency or uncertainty> |
| Blocked | <Blocked outcome> | <Low|Medium|High> | <What prevents progress and what would unblock it> |
| Skipped | <Skipped work> | <Low|Medium|High> | <Why it was intentionally excluded or deferred> |
```

Use one table and group rows in this order: **Done**, **Upcoming**, **Blocked**,
then **Skipped**. Use no more than five rows per state unless the user asks for
detail. If **Done** or **Upcoming** has no work, include one row stating
`Nothing material completed yet` or `Nothing material remains` and use `—` for
complexity. Include **Blocked** and **Skipped** rows only when evidence supports
them; do not add empty placeholder rows.

Keep both progress numerators in **left / total** order. Do not invert them into
completed / total. Counts are evidence summaries, not estimates; never round,
guess, or treat a partially completed ticket or wave as complete.

## Complexity scale

- **Low:** localized work with a known path and light verification.
- **Medium:** several files or components, meaningful integration, or broader
  testing.
- **High:** cross-system behavior, migrations, substantial coordination, or
  important unresolved risk.

Complexity describes scope, coupling, and risk. For a blocker or skipped item,
estimate the work needed to resolve or resume it. Do not present complexity as
a time estimate.

## Language rules

- Lead with the result, not the investigation.
- Use outcome language and explain why each item matters.
- Keep facts, risks, and unknowns distinct. Say `unknown` when evidence is
  missing.
- Do not call planned, coded-only, or unverified work done.
- Mention the most important blocker and any material skip in the BLUF; do not
  bury them in a long list.
- Distinguish **Blocked** work that cannot proceed from **Skipped** work that
  was deliberately excluded or deferred.
- Avoid implementation detail unless it changes the reader's understanding of
  progress or complexity.

## Example

```markdown
# Feature status: Saved searches

## BLUF

The core saved-search experience now works end to end: users can create,
rename, run, and delete searches, and the main behavior is covered by tests.
What remains is release hardening around existing-data migration and unusual
permission combinations. The migration rehearsal is blocked until a sanitized,
production-sized dataset is available, while support for obsolete browsers was
intentionally excluded from this release.

**Progress:** Tickets left **2/8** · Waves left **1/3**

## Status

| State | Work item | Complexity | Context |
|---|---|---|---|
| Done | Create and manage saved searches | Medium | The user flow, service behavior, and storage changes are integrated and verified. |
| Done | Prevent invalid saved searches | Low | Validation and clear error handling cover the expected bad-input cases. |
| Upcoming | Verify uncommon permission combinations | Medium | Test shared and read-only accounts before release approval. |
| Upcoming | Add release monitoring | Low | Alert on failed saves and slow search runs during rollout. |
| Blocked | Rehearse the existing-data migration | High | A sanitized, production-sized dataset must be provided before the rehearsal can proceed. |
| Skipped | Support obsolete browsers | Medium | This was deliberately excluded because those browsers fall outside the product's support policy. |
```
