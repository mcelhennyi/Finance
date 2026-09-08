# Expert review gates

Use expert review gates to route a default-branch pull request to the people
whose domain judgment is needed for the semantic change. The gate is asserted
only immediately before the final merge to `main`, `master`, or the repository's
other default branch. It does not transfer design ownership to an agent, replace
normal maintainer review, or pause ordinary development.

## The two-part model

1. **The roster** loads [`EXPERTS.md`](EXPERTS.md) first, then the optional
   project-owned `EXPERTS.project.md`. Together they map stable `EXPERT:<slug>`
   tags to a human name or role, contact route, GitHub reviewer, and the scope
   they protect. Project identities belong in the overlay.
2. **An authoritative design annotation** places one or more tags beside the
   section whose meaning requires that expertise.

```markdown
> **EXPERT-REVIEW:** `EXPERT:security`
```

Multiple experts are an AND gate:

```markdown
> **EXPERT-REVIEW:** `EXPERT:security`, `EXPERT:data-governance`
```

The tag is a stable semantic identifier, not a numbered documentation id. It
does not use `tasks/TAG-REGISTRY.md`. The roster owns identity resolution; the
design annotation owns the local review requirement.

## What is protected

An expert gate applies when any of these are true:

- the changed text is inside, or materially changes, a tagged design section;
- a changed design or code path matches the tag's **Protected paths** entry in
  merged `EXPERTS.md` + `EXPERTS.project.md` roster;
- a changed interface, invariant, data flow, risk decision, or acceptance
  criterion is explicitly governed by the tagged section; or
- a refactor preserves behavior but changes a protected boundary in a way that
  still needs expert judgment.

Formatting-only changes can be exempt only when they cannot alter meaning,
generated output, path ownership, or review context. State the exemption in the
handoff or PR instead of silently assuming it.

## Development is not gated

Expert mapping and approval never block design or ticket authoring, frontier
identification or dispatch, TEST -> DEV -> VAL, `triadDone` tracking, feature
closeout, or merges and pushes whose target is not the default branch. Ticket
and feature implementation may be complete while expert review is still
pending for the eventual default-branch merge.

During design and implementation, preserve `EXPERT:<slug>` annotations and
carry likely review areas into tickets or handoffs when useful. A missing,
ambiguous, inactive, or incomplete roster row is a PR review-planning issue,
not an implementation blocker. Do not appoint an expert or infer a substitute;
record the unresolved mapping for the default-branch PR.

## PR preparation and semantic mapping

When `finish-feature`, `finish-frontier`, or an equivalent workflow prepares a
PR to the default branch:

1. Diff the proposed head against the freshly fetched default branch.
2. Read `docs/design/EXPERTS.md`, then `docs/design/EXPERTS.project.md` when it
   exists. Search affected design for `EXPERT-REVIEW` / `EXPERT:` annotations
   and match changed paths against each roster row's **Protected paths**.
3. Interpret the change semantically: identify affected interfaces, invariants,
   data flows, risk decisions, algorithms, and acceptance behavior even when
   the changed file is outside a protected path. Conversely, explain when a
   path match is mechanically changed but its protected meaning is untouched.
4. Record each mapped `EXPERT:<slug>`, the semantic surface and paths that
   triggered it, why that expert is relevant, and the mapped PR reviewer.
5. Open or update the PR and request every usable mapped reviewer. An unresolved
   mapping does not block PR creation; keep it visible in the PR as pending
   governance that must be resolved before merge.

This interpretation layer is intentionally more precise than CODEOWNERS: it can
route review by meaning across files instead of relying only on path ownership.

## Approval evidence

Record approval where a later reviewer can follow it: the design amendment,
feature intake/closeout, ticket handoff, or PR description. Use this compact
shape when a repository has no stronger local convention:

```markdown
EXPERT-APPROVAL
- Tag: `EXPERT:security`
- Expert: <display name or role> (`@github-handle`)
- Decision: approved | changes-requested | pending
- Scope: <design section, paths, or commit range>
- Evidence: <PR review URL, decision record, or other durable reference>
- Date: YYYY-MM-DD
```

Approval is scoped. A prior approval for a different design, commit range, or
material behavior does not automatically cover later changes. If the human
operator is the listed expert, require an explicit approval statement and record
it; do not infer approval from identity or silence. Approval evidence collected
before the final PR head exists must be rechecked against that final scope.

## Pull-request enforcement

While the default-branch PR is open:

1. Keep the PR as **draft** or otherwise not merge-ready while required expert
   identities are unresolved or while the change is not ready for their review.
2. Request every mapped GitHub reviewer (for example with
   `gh pr edit <pr> --add-reviewer <login>` when authorized).
3. Put the required `EXPERT:<slug>` tags and approval state in the PR body.
4. Update the mapping and re-request review when later commits materially change
   a protected semantic surface.

Immediately before the final merge to the default branch, re-fetch the base and
inspect the current PR head. Require a usable mapping and scoped approval for
every applicable active expert, with no applicable changes-requested review.
Pending approval or an unresolved mapping blocks only that final merge; it does
not reopen completed ticket triads or block further non-default-branch work.

Expert approval and user manual validation are independent evidence. Neither
satisfies or overrides the other. Expert approval also does not authorize the
merge itself: an agent still needs the workflow's normal explicit authority to
merge or push the default branch and must never infer it from a review.

A requested reviewer is policy-enforced unless repository settings make it
platform-enforced. CODEOWNERS and branch protection/rulesets may complement the
semantic map, but their path-only model cannot replace it. Agents must verify
those settings or clearly say enforcement is not known; never claim that
`--add-reviewer` alone creates a required reviewer.

## Changing the roster or gate

Removing a gate, narrowing protected paths, changing the mapped expert, or
marking an expert inactive changes the governance of that area. Develop and
review that change normally, then require approval from the currently listed
expert (or documented repository-owner escalation when that person is
unavailable) immediately before its final default-branch merge. Record the
reason and effective date in the same change. Repository-owner escalation is an
approval path, not authorization for an agent to perform the merge.

`EXPERTS.md` is Skeleton-owned and may be refreshed by sync. Put real project
identities and scopes in `EXPERTS.project.md`; the companion is never written by
Skeleton. The protocol in this file and the mirrored agent rules continue to
update through normal Skeleton sync.
