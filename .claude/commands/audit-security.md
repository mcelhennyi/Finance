---
description: >-
  Read-only security analysis for a repo, design, service, dependency set,
  container image, protocol, or feature, including current CVE/advisory checks
  for the languages, packages, products, and protocols in scope.
---

# /audit-security

Follow the Cursor project skill **`.cursor/skills/audit-security/SKILL.md`**.

## Argument

One target scope path or identifier (required), for example:

- `/audit-security docs/design/payments/README.md`
- `/audit-security apps/api`
- `/audit-security package-lock.json`
- `/audit-security Dockerfile compose.yaml`
- `/audit-security docs/design/protocols/agent-ipc.md`

## What this is

- **Read-only** security review: map assets, trust boundaries, entry points, languages, protocols, dependencies, deployables, and operational controls.
- **Current vulnerability lookup:** check relevant CVEs/advisories using primary sources such as NVD, OSV, GitHub Security Advisories, CISA KEV, and vendor advisories; report source timestamps and exact package/product/version evidence.
- **Output:** plain-English security report with severity-ranked findings, CVE/advisory table, unknowns, and remediation verification.
- **Does not** exploit systems, run destructive scans, register **`FR-NNNN`**, write tickets, or implement code.

## End every turn for the user

End each response with **Executive summary**, **Suggested next step**, and **Options** when more than one reasonable path exists - see **`report-template.md`** in the skill folder.

## What runs next

When security findings need implementation work:

- Use `/feature-request <top-level design doc>` for a new feature.
- Use `/expand-feature <existing FR-NNNN>` when the security work belongs to an existing feature.
- Use `/identify-frontier` -> `/develop-frontier` after tickets exist.

## Compose (do not fork)

| Step | Command |
| --- | --- |
| Security audit (this) | **`/audit-security`** |
| Intake + tickets when needed | **`/feature-request`** or **`/expand-feature`** |
| Parallel implementation | **`/identify-frontier`** -> **`/develop-frontier`** (after tickets exist) |

**Development commands:** not required for docs-only audit. Run read-only scanner/build/test commands through **`./develop`**, Docker, Docker Compose, Dev Container, or CI images where possible, and document host exceptions.
