---
name: executive-summary
description: >-
  Create a concise, plain-English, evidence-backed executive summary for a
  project, feature, ticket, task, incident, or workstream. Use when the user
  asks for an executive summary, leadership update, BLUF, project status brief,
  task outcome summary, or a durable Markdown status artifact.
---

# Executive Summary

Create a durable status artifact that a reader can understand without opening
the repository or knowing its implementation vocabulary.

## Workflow

1. Resolve the source state before writing:
   - identify the project root;
   - capture the local branch, full commit, and short commit being summarized;
   - capture local wall-clock time with its UTC offset;
   - define the requested summary scope in one sentence.
2. Inspect direct evidence for that scope. Prefer current tracker/handoff files,
   version-control state, committed design or implementation artifacts, and
   relevant validation output. Do not infer completion from filenames or plans.
3. Write the shortest summary that preserves the decision-relevant facts. Lead
   with **Bottom Line Up Front**. Separate completed work, active work, verified
   blockers or risks, and the next milestone when those categories apply.
4. Save the result under the project root at:

   `tasks/executive-summaries/YYYY-MM-DD-HHMMSS-<short-commit>-<slug>.md`

   Use the source state's local date/time, a 7–12 character lowercase Git hash,
   and a lowercase ASCII hyphenated slug. Never save executive summaries under
   general `docs/` or the static manual.
5. Validate the saved file with:

   `python3 <skill-dir>/scripts/verify_summary.py <summary-path> --project-root <project-root>`

   Also run `git diff --check -- <summary-path>` when the summary is uncommitted.
6. Return a clickable link to the verified Markdown file and one sentence
   stating its scope and source commit.

## Required file shape

Start with YAML front matter so renderers hide traceability metadata from the
main reading flow. Quote string values and include every required field:

```yaml
---
created_at: "2026-08-08T14:05:09-05:00"
branch: "feat/FR-0001-example"
full_commit: "0123456789abcdef0123456789abcdef01234567"
project_root: "/absolute/path/to/project"
summary_scope: "Current delivery status for FR-0001"
evidence_basis:
  - "tasks/ticket-progress.md"
  - "git status and validation output at the source commit"
---
```

Follow it with this compact body shape:

```markdown
# Executive Summary

## Bottom Line Up Front

One short paragraph with the outcome, present state, and immediate implication.

## What is complete

Verified outcomes only.

## What is underway

Active work only.

## Blockers and risks

Verified blockers, material risks, and important unknowns.

## Next milestone

The next observable completion point.
```

Keep **Bottom Line Up Front** first. Omit a later section when it adds no useful
information, but do not hide a material blocker, risk, or unknown.

## Evidence and language rules

- Write for a non-specialist decision-maker. Expand or replace internal jargon.
- Distinguish facts, risks, and unknowns. Say `unknown` when evidence is absent.
- Include counts, commits, dates, or test results only when direct evidence
  supports them.
- Do not expose secrets, credentials, private customer data, or unrelated
  project details in the summary or metadata.
- Do not mutate project code, ticket state, remotes, or external systems while
  gathering evidence. The only default write is the summary artifact itself.
- Follow stricter repository privacy, approval, and documentation rules.
