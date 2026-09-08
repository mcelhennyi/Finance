---
name: actor-dream
description: >-
  Dream with actors, story graphs, outside forces, and guiding figures to extend
  daily-life user stories into grounded upgrade hypotheses, test ideas, and
  growth candidates while preserving docs authority and tag reservation rules.
---

# Actor dream

Use this skill when the user asks to dream with actors, extend user stories,
role-play seeded users, imagine profile-driven upgrades, graph cross-actor story
effects, allocate missing roles, add outside-force actors, apply guiding figures,
or convert persona friction into product growth candidates.

## Required reading

1. Load the actor profile source for the repo. Prefer:
   - `docs/design/actors/index.json` plus related actor/story Markdown files when present
   - `docs/design/seed-actor-profiles.md`
   - `docs/design/actor-driven-development.md`
   - an explicitly provided actor/profile doc
   - project-specific profile docs under `docs/design/`
2. Load the product/design source that constrains the dream:
   - `docs/design/feature-map.md` when present
   - relevant `docs/design/**` product docs
   - relevant `tasks/feature-history/FR-*/tickets.md`
3. If you will write formal numbered tags, load `tasks/TAG-REGISTRY.md` and follow the reservation rule before using `GR-*`, `DG-*`, `RW-*`, or other numbered IDs.

Do not skip this reading step. Actor dreams must be grounded in written product behavior, not free-floating invention.

## Output contract

For each selected actor, produce a concise dream card:

| Field | Meaning |
|-------|---------|
| Actor | Name plus seed anchors or profile section |
| Current life | What the actor is trying to do today |
| Current friction | Specific pain in the documented v0 flow |
| Dream | A sharper future experience in the actor's voice or from their routine |
| Trace | Story keys, UI surfaces, backend/domain surfaces, time/persistence behavior |
| Related actors | Actors affected by this story, including stakeholders, antagonists, or guiding figures |
| Story edges | Origin story, affected actor, handler story, and any missing handler |
| Role / figure gaps | New role, persona, antagonist, stakeholder, or guiding figure that should be allocated |
| Product shape | Proposed feature, refinement, test, or formal growth candidate |
| Safety | Security/privacy/RBAC/payment/provider limits that remain non-negotiable |
| Evidence to collect | Runtime metric, E2E observation, support signal, or operator feedback that would justify building it |
| Next artifact | Existing ticket to update, new `FR-NNNN` idea, design amendment, or "no action yet" |

## Rules

- Keep v0 authoritative. Do not rewrite design or code because a dream is appealing.
- If the dream identifies an actual missing spec needed for current implementation, call it a `DESIGN-GAP` candidate and stop before implementation until the owning doc is amended.
- If v0 works today but future scale or friction may force a change, call it a growth candidate. Do not write a formal `GROWTH GR-*` block until the ID is reserved in `tasks/TAG-REGISTRY.md`.
- If current code/docs knowingly diverge from settled design, call it a rework candidate and point to the diverging files. Do not silently normalize the mismatch.
- Include time behavior whenever relevant: session expiry, credential TTL, entry-session TTL, import review windows, billing periods, settlement runs, commission milestones, reminders, routines, or recurring jobs.
- Trace cross-actor effects. When a dream touches another actor, name the handler story on that affected actor. If no handler exists, generate the missing story as a coverage gap before proposing implementation.
- If the missing handler requires a new role, stakeholder, antagonist, or outside-force actor, allocate the actor class and enough personas to cover meaningful choices or failure modes.
- Guiding figures are optional principle lenses, not normal users. Use them only when the project wants a durable bias for decisions among alternatives, such as OODA tempo, extreme ownership, scientific rigor, safety-first operations, or profitable-MVP discipline. A guiding figure may bias story edges but must not override evidence, security, privacy, ethics, or written design authority.
- Keep synthetic actors synthetic. Never add or request real personal data, secrets, raw credentials, provider URLs, card data, or real member contact details.
- For UI ideas, note whether a static HTML mock is needed before implementation per the UI design mock workflow.
- Prefer updating existing feature/ticket artifacts when the dream clearly belongs to an active `FR-NNNN`; otherwise propose a new feature request.

## Persistence

If the user asks to save actor dreams, write them near the owning feature:

- `tasks/feature-history/FR-NNNN-<slug>/actor-dreams/YYYY-MM-DD-<actor-or-theme>.md`
- or a project-approved design doc under `docs/design/`

Saved dream files should include:

1. Executive summary
2. Actor dream cards
3. Story-edge table
4. Missing handlers / new roles / guiding figures
5. Traceability table
6. Growth/tag reservation notes
7. Suggested next step
8. Options when multiple follow-up paths are plausible

## Suggested workflow

1. Select actors by role coverage or user request.
2. Re-read each actor's profile and story keys.
3. Walk one realistic day or recurring cycle from the actor's point of view.
4. Name friction against current product surfaces.
5. Walk the story graph: origin story, affected actor, handler story, missing handler, and edge note.
6. Allocate missing roles/personas/outside-force actors when no existing actor can own the handler story.
7. Apply any project-approved guiding figure lens to order alternatives, then state the guardrails.
8. Convert friction into a dream that is still compatible with the business model and security posture.
9. Map the dream to frontend, backend, data, time, tests, and potential ticket/design artifacts.
10. Separate immediate fixes, design gaps, rework, refinements, and growth candidates.
11. Close with one recommended next step.
