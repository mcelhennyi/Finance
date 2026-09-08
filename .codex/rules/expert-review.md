# Expert review gates

`EXPERT-REVIEW` routes semantically affected parts of a default-branch PR to
named domain reviewers. Approval is asserted only immediately before final
merge to `main`, `master`, or the repository's other default branch. The
complete protocol and annotation format live in
**`docs/design/expert-review.md`**. Load **`docs/design/EXPERTS.md`** first and
project-owned **`docs/design/EXPERTS.project.md`** when present; together they
form the identity and path roster.

During design and ticket work, preserve applicable tags and review-plan notes.
Do not check approval or block design, ticketing, TEST -> DEV -> VAL,
`triadDone`, frontier dispatch, feature closeout, or non-default-branch
merge/push work because a mapping or approval is pending.

When preparing the default-branch PR:

1. Diff the PR head against the fetched default branch. Search affected design
   for **`EXPERT-REVIEW`** / **`EXPERT:`** and match changed paths against
   roster **Protected paths**.
2. Interpret affected interfaces, invariants, data flows, algorithms, risk
   decisions, and acceptance behavior. Record the semantic surface and why each
   expert applies; do not rely on paths alone.
3. Resolve every applicable tag to the listed display name/role and GitHub
   reviewer, then request targeted PR review. Missing or ambiguous mappings stay
   visible in the PR; do not infer or appoint an expert.
4. Record scoped **`EXPERT-APPROVAL`** evidence. Prior approval does not cover a
   materially different scope or final commit range.

Immediately before final default-branch merge, recheck the current head and
require all mapped approvals with no applicable changes-requested review.
Pending review blocks only that merge. Expert approval and user manual
validation are separate gates, and neither authorizes the merge; never infer
permission to merge or push the default branch.

Requesting a reviewer is not platform enforcement. CODEOWNERS and branch
protection may complement this policy, but semantic interpretation can route
review more precisely than path-only ownership. State which enforcement is
verified.

Removing or weakening a gate, changing its expert, or narrowing protected paths
requires approval from the currently listed expert or a documented repository-
owner escalation only at the final default-branch merge gate. That approval is
not merge authorization.
