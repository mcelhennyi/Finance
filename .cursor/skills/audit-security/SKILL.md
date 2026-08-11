---
name: audit-security
description: >-
  Read-only security analysis for a repository, design doc, code path, service,
  dependency set, container image, protocol, or planned feature. Use when the
  user runs /audit-security, asks for a security review, vulnerability review,
  threat-model readiness check, dependency or CVE audit, protocol hardening
  review, or wants a go/no-go security report before /feature-request,
  implementation, release, or deployment.
---

# Security audit

**Purpose:** Perform a broad, evidence-driven security analysis of a target scope. Identify design, implementation, dependency, configuration, protocol, privacy, and operational risks; check current CVEs and advisories for the exact languages, frameworks, packages, products, protocols, and deployment components in use; and produce a plain-English remediation report.

**This skill is read-only by default.** Do not exploit systems, brute-force credentials, bypass access controls, run destructive tools, fuzz live services, mutate lockfiles, or make code changes unless the user explicitly changes scope. For live endpoints or third-party systems, require clear authorization and a bounded scope before any active probing. Prefer local/static evidence, official advisories, and safe scanner output.

## User-facing close (required)

End every audit reply and saved report with:

1. **Executive summary** - verdict (**Ready** / **Caution** / **Blocked** / **Critical**) and the top 3 risks.
2. **Suggested next step** - one primary action, usually the highest-impact remediation or the missing evidence needed to finish the audit.
3. **Options** - only when multiple reasonable remediation paths exist (**A**, **B**, ...).

Template: **[report-template.md](report-template.md)**.

## Input

The user supplies one target scope, for example:

- `/audit-security docs/design/payments/README.md`
- `/audit-security apps/api`
- `/audit-security Dockerfile compose.yaml`
- `/audit-security package-lock.json`
- `/audit-security docs/design/protocols/agent-ipc.md`
- `/audit-security release/v1.4.0`

If the target is missing or ambiguous, ask once for the path, service, dependency set, image, protocol, branch, PR, or live system scope. If the target includes a live system, ask for authorization and boundaries before active testing. If the user forbids network access, skip online advisory lookup and mark CVE currency as **Unknown**.

## Workflow

### 1. Bootstrap context

Read, as needed:

- **`docs/ai-context.md`** and **`docs/ai-context.project.md`** when present - process, security expectations, command environment, and project overlays.
- **`.cursor/rules/stack-conventions.mdc`**, **README.md**, build files, CI files, deployment docs, and design docs that define the target's intended behavior.
- Existing security docs, risk registers, threat models, architecture diagrams, protocol specs, API docs, auth/RBAC docs, privacy docs, incident notes, and previous audit reports.
- **`tasks/TAG-REGISTRY.md`** only if the target uses durable security, risk, or traceability ids that must be verified.

For large targets, use subagents per **`docs/ai-context.md` section 1b** by subsystem or language, then merge findings into one report. Do not delegate reading this skill's instructions.

### 2. Establish scope and inventory

Create an evidence map before judging risk:

- **Assets:** secrets, credentials, tokens, keys, PII, proprietary data, model prompts, audit logs, configs, binaries, build artifacts, customer data, and safety-critical controls.
- **Trust boundaries:** user/browser to service, service to database, service to service, IPC/RPC, local file system, plugins/extensions, CI/CD, cloud provider, container boundary, desktop/mobile OS boundary, and external vendors.
- **Entry points:** HTTP routes, GraphQL, gRPC, WebSocket, CLI args, files, uploads, queues, webhooks, cron jobs, plugin APIs, browser messages, OAuth callbacks, SAML ACS endpoints, local sockets, and admin/debug interfaces.
- **Languages/runtimes:** source languages, frameworks, package managers, lockfiles, generated code, native extensions, unsafe/FFI use, runtime versions, and support status.
- **Protocols and formats:** TLS, HTTP, OAuth/OIDC/SAML, JWT, mTLS, SSH, SQL/NoSQL, Protobuf/gRPC, JSON/YAML/XML, AMQP/MQTT/Kafka, SMTP, DNS, WebRTC, custom binary formats, and file formats.
- **Deployables:** containers, base images, OS packages, serverless functions, package artifacts, CI actions, IaC modules, Kubernetes manifests, Helm charts, Terraform providers, desktop installers, or mobile packages.

State what is **in scope**, **out of scope**, and **unknown**. If exact versions are not available, say so; do not infer a clean result from vague dependency ranges.

### 3. Current CVE and advisory checks

Always perform current vulnerability lookup for in-scope third-party components unless network access is unavailable or the user explicitly forbids it.

Use primary or authoritative sources first:

- **NVD CVE API 2.0:** `https://services.nvd.nist.gov/rest/json/cves/2.0` for CPE, CVE id, keyword, and last-modified searches.
- **OSV / OSV-Scanner:** `https://api.osv.dev/v1/query`, `querybatch`, `osv-scanner`, and ecosystem-specific package/version matching for open source dependencies.
- **GitHub Security Advisories:** global advisories API and repository advisories for GitHub-hosted dependencies and Actions.
- **CISA KEV:** Known Exploited Vulnerabilities catalog for active exploitation priority.
- **Vendor advisories:** language/runtime, framework, OS distro, database, broker, cloud, appliance, protocol library, browser/runtime, and container base-image maintainers.
- **Optional prioritization:** FIRST EPSS for exploitation probability, when useful and available.

Use exact evidence:

- Package name, ecosystem, installed version, lockfile line, SBOM purl, container digest, image tag, OS distro version, runtime version, CPE, git commit, or vendor product/version.
- Retrieval date/time and source URL or command.
- Scanner/tool version when running local tools.

Prefer read-only commands. Run development/security commands inside **`./develop`**, Docker, Docker Compose, Dev Container, or CI images where possible. Examples to consider when relevant and already available: `osv-scanner`, `npm audit --json`, `pnpm audit --json`, `yarn npm audit --json`, `pip-audit`, `safety`, `cargo audit`, `cargo deny`, `govulncheck`, `bundle audit`, `composer audit`, `dotnet list package --vulnerable`, Maven/Gradle dependency-check, `trivy fs`, `trivy image`, `grype`, `syft`, and GitHub Dependabot alerts.

Treat missing evidence as an audit finding:

- No lockfile, SBOM, image digest, or runtime version means **Unknown**, not **clean**.
- A scanner "no vulnerabilities found" result covers only its inputs and database timestamp.
- CVEs may not cover design flaws, custom code defects, insecure defaults, misconfiguration, exposed secrets, weak auth, or protocol abuse.
- If online lookup fails, record the failure and mark CVE currency **Incomplete**.

### 4. Threat model and misuse review

For each trust boundary and entry point, test the design or code against likely misuse:

| Area | Check |
| --- | --- |
| Authentication | Identity proofing, session lifecycle, MFA/passkeys where required, callback validation, service identity, token audience/issuer/expiry. |
| Authorization | Object-level and function-level access control, RBAC/ABAC, tenant isolation, admin surfaces, least privilege, default deny. |
| Input handling | Schema validation, canonicalization, parser limits, deserialization, file uploads, path traversal, SSRF, injection, type confusion. |
| Output handling | XSS, template escaping, response splitting, data overexposure, error detail, stack traces, debug endpoints. |
| Data protection | Encryption in transit/at rest, key management, secret storage, rotation, backups, retention, deletion, PII minimization. |
| Protocol security | TLS/mTLS, certificate validation, replay resistance, nonce/state, downgrade prevention, message authentication, size/rate limits. |
| Supply chain | Dependency freshness, malicious packages, lockfile integrity, package provenance, build reproducibility, CI permissions, signed artifacts. |
| Operations | Logging hygiene, auditability, alerting, abuse throttles, incident evidence, secure defaults, configuration drift, disaster recovery. |
| Privacy | Personal data collection, purpose limitation, consent, sensitive logs, analytics beacons, export/delete workflows. |
| Resilience | Resource exhaustion, queue poisoning, retry storms, unsafe timeouts, backpressure, idempotency, dead-letter handling. |

Use common frameworks as lenses, not as a substitute for evidence: OWASP Top 10, OWASP API Security Top 10, ASVS, MASVS, SAMM, CWE, STRIDE, SLSA, CIS Benchmarks, NIST SSDF, and project-specific policies.

### 5. Language, runtime, and protocol-specific probes

Tailor the audit to what is actually present. Include **Not applicable** only when evidence supports it.

| Target | Minimum probes |
| --- | --- |
| JavaScript / TypeScript / Node | Prototype pollution, dependency confusion, install scripts, SSRF, shell execution, unsafe `eval`/dynamic import, XSS/CSP, cookie flags, Electron bridge isolation if present. |
| Python | `pickle`/`marshal`/unsafe YAML, subprocess and shell quoting, path traversal, template escaping, SQL injection, dependency pinning, virtualenv/runtime support, native wheels. |
| Go | `govulncheck`, `net/http` timeouts, SSRF, template escaping, `unsafe`/cgo, exposed `pprof`, context cancellation, module replacement, private module leaks. |
| Rust | `cargo audit`/RustSec, `unsafe` blocks, FFI boundaries, panic handling, deserialization, feature flags, supply-chain trust. |
| Java / Kotlin / Scala | Deserialization, XML XXE, JNDI/classpath loading, Spring/Security config, Maven/Gradle dependency locks, secrets in properties, JWT/OAuth libraries. |
| C / C++ | Memory safety, integer overflow, unsafe string APIs, parser bounds, sanitizers/fuzz coverage, compiler hardening, third-party native library CVEs. |
| .NET | NuGet vulnerabilities, XML/deserialization, auth middleware ordering, data protection keys, logging of secrets, file upload/path handling. |
| SQL / data stores | Injection, least-privilege users, row-level security, migrations, backups, encryption, audit logs, admin interfaces, data retention. |
| HTTP / browser | TLS, HSTS, CORS, CSRF, cookies, security headers, XSS, clickjacking, cache controls, redirect validation, rate limits. |
| GraphQL | Introspection exposure, query depth/complexity, authorization per resolver, batching abuse, error data leakage. |
| gRPC / Protobuf | mTLS/auth, reflection, message size, schema evolution, default values, unknown fields, deadline enforcement, replay and idempotency. |
| OAuth / OIDC / SAML / JWT | Redirect URI validation, state/nonce, issuer/audience, algorithm confusion, key rotation, token storage, logout, clock skew. |
| Queues / event streams | Topic ACLs, poison messages, replay, idempotency, retention, PII in events, schema compatibility, consumer auth. |
| Containers / Kubernetes | Base image CVEs, non-root user, capabilities, seccomp/AppArmor, secrets, network policies, image signatures, admission controls. |
| CI/CD | Token scopes, untrusted PR execution, pinned actions, artifact signing, dependency cache poisoning, secret masking, release provenance. |
| AI / agentic systems | Prompt injection, tool authorization, data exfiltration, retrieval poisoning, untrusted content isolation, audit logs, eval gates. |
| Desktop / mobile | Local IPC, deep links, updater signing, sandboxing, secure storage, file permissions, certificate pinning where appropriate. |

### 6. Code and configuration reality

If implementation exists:

- Inspect the cited source paths and config, not only docs.
- Search for dangerous APIs, secrets, debug flags, permissive CORS, test credentials, TODO security notes, disabled verification, broad IAM policies, wildcard origins, world-readable files, and insecure defaults.
- Compare design claims to code behavior. Classify mismatches as design gaps, implementation defects, or accepted risk.
- Avoid publishing full secrets in the report. If a secret is found, show only type, file path, and a redacted fingerprint.

If only design exists:

- Verify security requirements are specific enough to become acceptance criteria.
- Flag missing auth, data classification, logging, privacy, dependency, protocol, and validation requirements as blockers or caution items.
- Recommend **`/feature-request`** only when security-critical acceptance criteria are clear enough to ticket.

### 7. Severity and prioritization

Rank findings by practical risk, not just CVSS:

| Severity | Meaning |
| --- | --- |
| **Critical** | Active exploitation, public exposure of secrets/PII, CISA KEV reachable in this target, unauthenticated remote code execution, auth bypass, tenant breakout, or release-stopping cryptographic/key failure. |
| **High** | Likely exploitable path to sensitive data, privilege escalation, persistent compromise, critical dependency CVE with reachable code, or missing required security control. |
| **Medium** | Plausible abuse with constraints, defense-in-depth gap, incomplete logging/monitoring, moderate dependency CVE, or uncertain exposure needing follow-up. |
| **Low** | Hardening, hygiene, outdated but not reachable dependency, documentation gap, or best-practice improvement with limited exploitability. |
| **Info** | Useful observation, assumption, or evidence note. |

For each finding, include: title, severity, affected component, evidence, impact, exploitability context, remediation, verification, owner if known, and residual risk. Include CVE/GHSA/OSV ids when applicable.

### 8. Verdict

| Verdict | Meaning |
| --- | --- |
| **Ready** | No Critical/High findings; current CVE/advisory checks completed for known versions; Medium/Low findings have acceptable remediation or monitoring. |
| **Caution** | No known Critical blocker, but Medium/High uncertainty, incomplete evidence, or accepted risk remains. Proceed only with named follow-up. |
| **Blocked** | Missing evidence or unresolved High risk would force unsafe implementation/release guesses. |
| **Critical** | Confirmed active exploitation risk, exposed secret/data, reachable KEV/critical CVE, auth bypass, RCE, or similar stop-ship issue. |

State the verdict once at the top and again in **Executive summary**.

### 9. Optional artifact

For non-trivial audits, write:

`tasks/security-audits/YYYY-MM-DD-<short-slug>-security-audit.md`

Use **[report-template.md](report-template.md)**. Link the target path(s), commit/branch, scanner commands, advisory source timestamps, and any incomplete checks. Commit only when the user asks to commit.

## Compose with other commands

| Situation | Command |
| --- | --- |
| Security requirements are missing from design | Amend design, then rerun **`/audit-security`** or **`/audit-design`** |
| Design is secure enough for ticketing | **`/feature-request <same top-level design doc>`** |
| Findings should become tracked implementation work | **`/feature-request`** or **`/expand-feature`**, depending on whether a feature already exists |
| Parallel implementation later | **`/identify-frontier`** -> **`/develop-frontier`** after tickets exist |

**Template sync:** Keep **`.cursor/skills/`**, **`.claude/commands/`**, and **`.agents/skills/`** aligned per **`.cursor/rules/cursor-claude-doc-sync.mdc`**.

## What not to do

- Do not claim "no CVEs" unless exact versions were checked against current sources.
- Do not disclose full secrets, exploit payloads, or step-by-step abuse instructions.
- Do not run destructive scanners, fuzzers, or active probes against live systems without explicit scope and authorization.
- Do not silently edit design or code to pass the audit.
- Do not register **`FR-NNNN`**, write tickets, or implement fixes during the audit unless the user explicitly asks for that follow-on workflow.
