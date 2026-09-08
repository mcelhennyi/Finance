# `90-closeout.md` template (finish-feature)

Copy into **`tasks/feature-history/FR-NNNN-<slug>/90-closeout.md`** when **`/finish-feature`** runs and the **feature-complete gate** passes. Replace placeholders; delete sections that do not apply.

```markdown
# FR-NNNN closeout — <short feature title>

**Merged:** YYYY-MM-DD — [**PR #N**](<url>) → **`<default-branch>`** @ `<merge-sha>`
<!-- If PR not merged yet: **PR pending:** [#N](<url>) — closeout drafted at finish-feature; refresh merge line after merge. -->

## Executive summary

<What shipped; one short paragraph.>

## Delivered surfaces

| Surface | Location |
|---------|----------|
| <name> | `<path>` |

## Tickets

| Ticket | Summary | Status |
|--------|---------|--------|
| `T-FR-NNNN-xx` | <title> | TEST / DEV / VAL **done** |

## Validation

- <command or environment> — <result>

## Expert review

| Expert tag | Semantic surface / paths | Human / role | State | Evidence or requested reviewer |
|---|---|---|---|---|
| `EXPERT:<slug>` | <behavior/invariant and paths> | <name or role> | approved / pending / mapping unresolved / changes requested | <URL or `@reviewer`> |

*If none:* “No `EXPERT-REVIEW` gate applied to the delivered paths.”

## User manual validation

**State:** not required / pending / passed / changes requested

<Evidence or operator note. This is independent of expert approval.>

## Deferred / follow-up

| Item | Tracking |
|------|----------|
| <item> | <FR / DESIGN-GAP / doc> |

## Suggested next step

<One sentence for the next agent or human.>

## Options

| Option | When |
|--------|------|
| <path A> | <when> |

## Audit

- **Merge commit:** `<sha>` (or *pending*)
- **Feature branch:** `feat/FR-NNNN-<slug>` (retained on remote)
- **Handoff:** [`handoffs/YYYY-MM-DD-finish-feature.md`](handoffs/YYYY-MM-DD-finish-feature.md)
- **Expert enforcement:** semantic policy-only / CODEOWNERS + protected branch verified
- **Final merge authority:** not inferred; record the separately authorized merger/action when known
```
