# AI development context

**Single source of truth for AI-assisted development *process***: session flow, worktrees, tickets, collaboration norms, and how spec ↔ code conflicts are handled. **Cursor** (`.cursor/rules/main.mdc`), **Claude Code** (`CLAUDE.md`), and **Codex** (`AGENTS.md` + **`.codex/rules/session.md`**) should reference this file **and**, when it exists, the optional companion **`docs/ai-context.project.md`** (see **Project-specific overlays** below and **`docs/skeleton-project-overlays.md`**).

**Product and system design** live under **`docs/design/`** (and, if you publish a docs site from this repo, treat that site as the **primary source of truth** for business + system design the same way you would authoritative pages under **`docs/design/`**). This file does not duplicate those specs; it tells agents how to use them.

This document is **stack-agnostic**. Language-specific rules belong in **`.cursor/rules/stack-conventions.mdc`** (or equivalent) once you choose a stack.

## Project-specific overlays

Repositories may ship **`docs/ai-context.project.md`** beside this file. It is **not** copied or modified by **`./sync-skeleton`**; keep long-lived, repo-only process rules there so the base file can track the skeleton template. Naming rules and examples: **`docs/skeleton-project-overlays.md`**.

---

## Session bootstrap

At session start, load in order:

1. **`docs/ai-context.md`** (this file; refreshed from **`.skeleton/`** on **`./sync-skeleton`** when this path is not syncignored)
2. **`docs/ai-context.project.md`** when the file exists — repo-local extension; **never** written by **`./sync-skeleton`** (see **Project-specific overlays** above)
3. **`tasks/ticket-progress.md`** — queue beacon, optional **Parallel streams**, and **TEST / DEV / VAL** rows
4. **`docs/design/architecture/overview.md`** when it exists and is populated
5. **`README.md`**
6. **`tasks/lessons.md`**

Skim **`tasks/handoffs/`**, **`tasks/feature-history/REGISTRY.md`**, and **`tasks/TAG-REGISTRY.md`** for recent decisions and id allocation state.

---

## Worktree policy and session status

- **Local worktree root:** store all repo-local git worktrees under **`.worktrees/`** (gitignored). Do not commit nested worktree directories.
- **Per-feature worktree:** each **`FR-NNNN-<slug>`** gets a feature integration worktree under **`.worktrees/FR-NNNN-<slug>/feature/`** on branch **`feat/FR-NNNN-<slug>`**.
- **Per-ticket / per-stage worktree:** each worked implementation ticket or stage gets its own child worktree under the feature folder, e.g. **`.worktrees/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name/`**, on a branch named with both feature and ticket/stage, e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`**. Create these branches from the current feature branch, then merge them back into **`feat/FR-NNNN-<slug>`**.
- **Repo-root `CURRENT.md` (implementation branches):** on **`feat/FR-NNNN-<slug>`** and **`feat/FR-NNNN-<slug>/T-…`** branches, maintain a short **`CURRENT.md`** at the repository root describing branch-local state and next actions; refresh through merges and phases; **remove** it when integrating to **`main`** unless the repo documents otherwise — see **`.cursor/skills/feature-request/SKILL.md` → Branch state (`CURRENT.md`)** (on **`main`** during parallel design, prefer per-feature **`README.md`** under **`tasks/feature-history/`** over a competing root file).
- **Parallel streams:** multiple tickets or features may be active; each stream keeps its own worktree. Document parallel work in **`tasks/ticket-progress.md`** (**Parallel streams** table) so status is visible.
- **Integration checkout** (often repo root on the default branch) coordinates merges and shared task files; avoid feature implementation there unless the team directs it.

**Session status values:** `starting` | `planning` | `developing` | `testing` | `integrating` | `complete` | `blocked` | `handoff`

---

## Docs authority and escalation

### Documentation as source of truth

- **Design docs are intended to be correct** for the behavior and interfaces they describe. When documentation and code disagree, **fix the code**, not the doc. The design is the authority for specified behavior (aligned with a **docs-first** / **MkDocs-as-primary** posture when your project adopts a published site).
- **Manual docs are implementation explanations:** when a user explicitly invokes **`/explain-and-document`** (or clearly asks to explain and document something), write the explanation into the static HTML manual under **`docs/manual/`**. Do **not** treat ordinary explanatory questions as automatic manual updates. Use **`/update-manual`** to keep the manual factually aligned with code by diffing from **`docs/manual/update-log.html`**'s last reviewed hash; every manual content change must reconsider the manual's format, order, grouping, directory structure, and fuzzy search index so readers can reach goals quickly.
- **No silent spec edits:** if the design is wrong or incomplete, use the amendment process below — same discipline as “documentation is the source of truth, but the source of truth can change auditably.”
- **Ambiguity:** if you are inventing interfaces or behavior not grounded in **`docs/design/`** (or an agreed ticket that extends it), **stop** — that is a **`DESIGN-GAP`** until resolved.
- **Where there is no design yet:** major behavior should land as a short spec under **`docs/design/`** (or an **`FR-NNNN`** design artifact your process defines) before or alongside code, not only in implementation.

### Escalation tags

| Tag | When |
|-----|------|
| `DESIGN-GAP` | Spec ambiguous — stop; do not guess |
| `DESIGN-FLAW` | Wrong testable assumption in design |
| `CODE-DEFECT` | Design correct; implementation wrong |
| `REWORK-REQUIRED` | Design/intent is settled and correct, but **shipped code or another doc is knowingly out of sync** with it — a **durable** flag that survives until the rework lands (unlike `CODE-DEFECT`, which you just fix now) |
| `COMPLETED` | Implementation and design match; all criteria met |

**`REWORK-REQUIRED` vs `CODE-DEFECT`:** `CODE-DEFECT` = code is wrong against a correct design, fix it immediately (transient). `REWORK-REQUIRED` = a deliberate, recorded divergence between settled intent and existing code/docs that is tracked until reworked — it must name the specific file/spec that deviates and the intended end state, and is removed in the same change that lands the rework. Full convention: **`.claude/rules/rework-required.md`** (mirrored **`.cursor/rules/rework-required.mdc`**).

**Numbered tag ids** (`DG-`, `DF-`, `RW-`, `GR-`, `R-`, `DEC-`, `TS-`, traceability `@…`, amendments): **reserve in `tasks/TAG-REGISTRY.md`**, commit, and **push to the default branch before use** — same deconfliction discipline as **`FR-NNNN`** in **`REGISTRY.md`**. See **`.cursor/rules/tag-reservation.mdc`** (mirrored **`.claude/rules/tag-reservation.md`**).

**Evaluable `GROWTH` (`GR-…`):** when the trigger is measurable at runtime, software **shall** monitor and log **`GROWTH_TRIGGERED`** on fire (self-report need to amend design). Monitors must be **compiled out** by default and **runtime-disableable** when compiled in — **`.cursor/rules/growth-monitoring.mdc`** (mirrored **`.claude/rules/growth-monitoring.md`**).

### Amendment format

```markdown
<!-- AMENDMENT: <AREA>-<NUMBER> -->
<!-- Author: <agent session> -->
<!-- Date: YYYY-MM-DD -->
<!-- Reason: <rationale> -->

<updated content>

<!-- /AMENDMENT -->
```

---

## Implementation standards (fill when stack is chosen)

- **Languages and frameworks:** Record versions, build commands, and lint/format rules in **`README.md`** and **`.cursor/rules/stack-conventions.mdc`** (set `alwaysApply: true` there when ready).
- **Development command environment:** Run development-specific commands (**build**, **test**, **lint**, **format**, generators, package-manager scripts, doc builds, and dev servers) **inside Docker / Docker Compose / Dev Container / CI images where possible**. Use checked-in wrappers such as **`./develop`**, `docker compose run`, or the configured Dev Container before host-local execution. If no container path exists for a command, run it on the host only as a documented exception in the ticket diary / handoff, and prefer adding a containerized path as follow-up.
- **Testing:** Prefer **tests before behavior** when your ticket template uses phased work. Run **VAL** (verification) in the containerized environment your tickets specify (Docker / Docker Compose / Dev Container / CI image where possible).
- **Web UI validation (required for web UI work):** Any change that creates or modifies user-visible web UI must pair deterministic frontend checks with rendered browser verification before **VAL** is marked **`done`**. Do not rely on unit tests alone when layout, navigation, route state, responsiveness, accessibility-critical controls, or browser-only behavior could regress. Run lint, typecheck, tests, build, and E2E scripts when present through Docker / Docker Compose / Dev Container / CI images where possible; then start the local app and inspect affected routes and states at desktop and mobile widths for overflow, clipped text, broken navigation, missing loading / empty / error / permission states, console or network errors, and unsafe exposure of credentials, tokens, private URLs, personal data, or stack traces. Project overlays or stack conventions must define the exact commands, local URL, browser-capable tool, and route/state matrix. If rendered browser tooling is unavailable, document the exception and substitute the strongest available E2E, screenshot, or manual evidence in the ticket diary or handoff.
- **Unit tests as default:** Add or update unit tests for new behavior and bug fixes unless the change is docs-only or pure scaffolding. Prefer fast, deterministic tests that isolate one behavior per case.
- **Simplicity-first implementation:** Prefer the smallest design that satisfies the documented requirement. Reuse existing patterns before introducing new abstractions, and only add complexity when a concrete constraint requires it.
- **File size and cohesion:** Prefer small, cohesive files over broad “god files.” When a file grows to multiple responsibilities or becomes difficult to review, split it into focused modules with clear interfaces.
- **Runtime efficiency:** Keep hot-path code and I/O efficient by default (avoid unnecessary allocations, repeated network/file calls, and quadratic loops on large inputs). When trade-offs exist, favor correctness first and document notable performance decisions in the ticket diary / handoff.
- **Security:** Follow your organization’s policies. Do **not** commit secrets; keep `.env*` out of git unless using checked-in **`.env.example`** placeholders only.
- **Downstream compliance changelogs:** When a repo publishes templates, shared packages, generated code, or process/tooling that child repos consume, every change that affects those children must include a dense, agent-readable changelog or migration note. It should name who must update, how to detect drift, required edits, verification commands, and any safe fallback so downstream repos can be brought back into compliance without re-auditing the full upstream diff.

---

## Traceability

Use a short project-level tag on non-trivial units, for example **`@PROJ-<AREA>-<NUMBER>`**, and define **AREA** names in **`docs/design/documentation-style.md`**. Replace **`PROJ`** with your chosen prefix when you run **`init-project`**.

## Actor-driven seed profiles

When a repo has seeded users, personas, tenants, accounts, operators, admins, or other role-bearing fixture actors, maintain an actor-profile design doc under **`docs/design/`** (recommended path: **`docs/design/seed-actor-profiles.md`**) before those actors drive implementation or E2E tests.

Each seeded actor profile should include: seed anchors, role and scope, personality, job-to-be-done, daily or recurring routine, stable story keys, UI surfaces, backend/API/domain surfaces, persistence and time behavior, security/privacy boundaries, test duties, and growth-dream candidates. New seed users should not reach **VAL** until the actor profile and downstream test/traceability rows are updated.

Use profiles to diversify control-flow coverage: when several actors share a role, assign them different choices, states, permissions, failure paths, schedules, and support needs unless overlap is intentional.

Actor-driven development is broader than seeded app users. Include outside-force actors when they shape product behavior: stakeholders, investors, auditors, regulators, vendors, support teams, antagonists, abuse patterns, and optional guiding figures. Guiding figures are named principle lenses such as OODA-loop tempo, extreme ownership, scientific rigor, safety-first operations, or profitable-MVP discipline; they bias design alternatives but must not override evidence, security, ethics, or written design authority. See **`docs/design/actor-driven-development.md`** for the generic process, templates, story graph, and example.

Every cross-actor story effect needs a story graph edge and a handler story on the affected actor. If no handler story exists, add one; if no actor can own it, allocate a new role or outside-force persona and link it before **VAL**. Actor dreams may propose refinements or growth candidates, but formal numbered **`GROWTH GR-*`**, `DESIGN-GAP`, `REWORK-REQUIRED`, and related tags still require reservation in **`tasks/TAG-REGISTRY.md`** before use.

For app/agent consumption, maintain a parseable actor graph under **`docs/design/actors/`** when the profile system becomes non-trivial: one Markdown file per actor/story, typed **`edges.jsonl`**, generated **`index.json`**, and flat **`actor-graph.json`**. The skeleton profile-server contract in **`docs/design/profile-server-app.md`** defines the future generic **`./develop profiles up|down|restart|status|logs`** viewer for 3D graph exploration and role availability inspection.

---

## Implementation ticket IDs (`T-FR-NNNN-xx`)

Tickets use a **feature id** **`FR-NNNN`** (four digits) and a per-feature sequence **`xx`**.

- **Format:** **`T-FR-NNNN-xx`** — see **`docs/design/documentation-style.md`**.
- **Reserved platform line:** **`FR-0000`** — core bootstrap; canonical **`T-FR-0000-xx`** definitions may live in **`tasks/feature-history/FR-0000-bootstrap/tickets.md`**.
- **Plain-English bodies:** New and not-yet-started tickets must lead with a cold-readable **In plain English** block (plus why / out of scope / done-when) before detailed acceptance criteria — **`.cursor/skills/feature-request/SKILL.md` → Plain-English ticket writing**. Do not rewrite completed or in-progress tickets unless the user asks.

---

## Workflow orchestration

### 1. Plan mode

Use planning for multi-step or architectural work.

### 1b. Subagents ahead of large work (context budget)

- **Prefer subagents before large work** so the main session keeps a **thin context** and does not lose track of goals. Spawn delegated work **early** when the task is likely to span **many files**, **several subsystems**, **broad repo exploration**, or **more than one focused session** of edits.
- **Orchestrator role:** define success criteria, boundaries, and return format; merge **bounded handoffs** (paths, decisions, short markdown) from subagents instead of inlining huge tool dumps in the parent thread.
- **Examples:** repo-wide search → delegated exploration; parallel implementation tickets (**`T-FR-NNNN-xx`**) → **`develop-frontier`** (one subagent per ticket); large **`FR-NNNN`** design → subagents per subsystem with one **serial diary** owner; **several `FR-NNNN` in design** → one subagent **per feature directory** so each **`serial-diary.md`** stays coherent.
- **Platform:** In Cursor, use the **Task** tool with an appropriate `subagent_type` where available; in Claude Code, use **subagents** per product docs; in Codex, use delegated agents when the current Codex environment exposes them and the user/session policy allows delegation. If subagents are unavailable, **stop and split** the work into smaller user-visible steps rather than monolithic execution.

### 2. Subagent strategy

- **Per ticket** (id **`T-FR-NNNN-xx`):** phases **TEST → DEV → VAL** serially inside that ticket’s section in the owning feature’s **`tickets.md`**, **one child worktree** under that feature’s **`.worktrees/FR-NNNN-<slug>/`** folder. Development commands inside that worktree still use Docker / Dev Container / CI images where possible.
- Do **not** parallelize phases for the **same** ticket across subagents.
- **Parallel tickets:** use **`identify-frontier`** / **`develop-frontier`**. Before the first wave and every later wave, **`develop-frontier`** refreshes the skeleton in a clean default-branch integration worktree, lands any validated sync change, and ensures affected feature branches contain that sync before ticket worktrees launch. Then merge ticket/stage work into **`feat/FR-NNNN-<slug>`**, and keep iterating on the feature branch until **§2d** **feature-complete gate** is met; use **`finish-feature`** (**`feat/FR-NNNN-<slug>`** → default branch PR) or **`finish-frontier`** (merge straight to the default branch) per policy — the parent should **delegate** implementation streams per **§1b** rather than doing every ticket inline.

### 2b. Feature request lifecycle (product `FR-NNNN`)

- **Pre-ticket design audit (recommended):** **`/audit-design <top-level-design-doc>`** — **`.cursor/skills/audit-design/SKILL.md`** — plain-English readiness report (gaps, flaws, rework, deferrals) before **`/feature-request`** when design under **`docs/design/`** already exists.
- **Security audit (as needed):** **`/audit-security <target-scope>`** — **`.cursor/skills/audit-security/SKILL.md`** — read-only security analysis for a design, code path, service, dependency set, container image, protocol, or release scope, including current CVE/advisory checks before ticketing, implementation, release, or deployment.
- **Cursor skill:** `feature-request` — **`.cursor/skills/feature-request/SKILL.md`**
- **Claude command:** `/feature-request` (and **`/feature-request-continue`** to resume).
- **Codex:** **`source-command-feature-request`** under **`.agents/skills/`** (thin wrapper → **`.cursor/skills/feature-request/SKILL.md`**). Matching **`source-command-*`** wrappers cover the other slash commands. Session bootstrap and binding rules: **`.codex/rules/session.md`**; Codex-only overlay: **`.codex/project.md`**.
  **`/finish-feature`** owns **closeout** when the **feature-complete gate** passes (**§2d**, **`.cursor/skills/finish-feature/SKILL.md` §5–§7**), including the **`/explain-feature`** before/after HTML artifact and fresh-context **`/update-manual`** pass for **`docs/manual/`**. **`/feature-request-continue`** must **`git fetch`** and **verify** an integration PR is still **open** before recommending merge when docs still read like a pending PR; if already merged but closeout is missing, run **`/finish-feature`** closeout steps (or apply the same bookkeeping: **`90-closeout.md`**, **`REGISTRY.md`**, **`ticket-progress.md`**, explain-feature artifact, manual update, drop root **`CURRENT.md`**) so the next step is not stale.
- **Registry and history:** **`tasks/feature-history/REGISTRY.md`**, one directory **`tasks/feature-history/FR-NNNN-<slug>/`** per feature (intake, layered design, **`20-tickets-dag.md`**, **`serial-diary.md`** / **`parallel/`**, optional **`DIARY.md`**, **`handoffs/`**, **`90-closeout.md`**). **Reservation rule:** once **`FR-NNNN`** and **`next_id`** are updated and the minimal feature stub exists, **commit and push to `main` right away** so other parallel features see the assignment and do not pick the same id.
- **Expanding an existing feature:** **`/expand-feature`** / **`.cursor/skills/expand-feature/SKILL.md`** records a new addition/change as same-**`FR-NNNN`** work without allocating a new **`FR-NNNN`**. Scale the ceremony to the ask: simple UI adjustments use a dedicated child worktree plus focused validation and an HTML mock saved under **`docs/design/mockups/`** (updated from the current UI when possible); larger additions get a **`30-expand-YYYY-MM-DD-<slug>.md`** addendum inside that feature folder, deep design as a natural extension, same-FR **`T-FR-NNNN-xx`** tickets, and updates to **`20-tickets-dag.md`**, **`tickets.md`**, **`tasks/ticket-progress.md`**, **`docs/design/tickets-initial.md`**, and registry notes. Completed ticket scope is not silently rewritten; follow-up tickets capture rework.
- **Composes** with: **`/identify-frontier`**, **`/develop-frontier`**, **`/finish-feature`** (default for product implementation per **§2d**), **`/finish-frontier`** — the feature request flow **produces and lands** tickets with ids **`T-FR-NNNN-xx`**, then those commands run on the ticket graph. It does **not** replace them.
- **Disambiguation:** *Identify* in the spoken *identify (FR) → develop → finish* product flow = **register `FR-NNNN` and intake**; **`/identify-frontier`** = parallel **tickets** from all **`tasks/feature-history/**/tickets.md`** + **`ticket-progress.md`** and should run **only after** tickets exist.

### 2c. Parallel features (multiple `FR-NNNN`) and the global ticket DAG

- **Parallel product features are allowed:** Several **`FR-NNNN`** efforts may be in **`design`** or **`in-progress`** at the same time. Each keeps its own directory under **`tasks/feature-history/FR-NNNN-<slug>/`** (and its own **`parallel/`** diaries). **`REGISTRY.md`** is the roster of all features and statuses.
- **One global dependency graph:** Every implementation ticket (**`T-FR-NNNN-xx`**) is **defined** in a feature’s **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`**; **`docs/design/tickets-initial.md`** holds the **combined DAG** (mermaid) and links. **`identify-frontier`** computes **eligible ∩ incomplete** over the **entire** graph — tickets belonging to **different** features often run in the **same** frontier batch when **Deps** do not block each other.
- **Orchestration:** **`develop-frontier`** may therefore mix tickets from multiple features in one wave. Its per-wave skeleton gate must complete first: sync from a clean current default-branch worktree, reconcile the changelog, land any update, and merge that landed base into each affected feature branch before creating child ticket worktrees. Each ticket then gets **one subagent** and **one child worktree** under its owning feature folder (see **§1b** / **§2**). Merge completed ticket/stage branches into each affected **`feat/FR-NNNN-<slug>`**, validate, and push **that feature branch** while work continues. Use **`finish-feature`** only when **§2d** **feature-complete gate** is satisfied for that **`FR-NNNN`** (then **PR** **`feat/FR-NNNN-<slug>`** → default branch), **or** use **`finish-frontier`** when merging **directly** into the default branch in dependency-safe order across **all** merged branches per team policy.
- **Shared files (`tasks/ticket-progress.md`, per-feature **`tickets.md`**, `docs/design/tickets-initial.md` DAG, `REGISTRY.md`):** Parallel agents must **avoid clobbering** shared tables: update **only** the **Progress** row for the **ticket id you own**; edit **only** your feature’s **`tickets.md`** for **`###`** sections; for **Current focus** / registry / global mermaid **`triadDone`**, **coordinate** (short handoff in **`tasks/handoffs/`**, or a single integration owner). **`triadDone`** unions on merge follow **Finish-frontier merge notes** at the end of this file.
- **Hot-file contention:** If two parallel streams must edit the **same** files repeatedly, **serialize** via an explicit **dependency** in the relevant **`tickets.md`** or a small **foundation ticket** that lands first.

### 2d. Feature integration branch, `finish-feature`, handoffs, diaries, and branch audit

- **Feature integration branch + worktree:** For each **`FR-NNNN`** in implementation, maintain a long-lived git branch **`feat/FR-NNNN-<slug>`** (same **`<slug>`** as the feature-history folder) checked out at **`.worktrees/FR-NNNN-<slug>/feature/`**.
- **Ticket/stage branches:** Every worked ticket or stage branches from the feature branch and includes both names, e.g. **`feat/FR-NNNN-<slug>/T-FR-NNNN-xx-short-name`** (or **`feat/FR-NNNN-<slug>/stage-short-name`** for non-ticket stages). Its worktree lives under **`.worktrees/FR-NNNN-<slug>/<ticket-or-stage-slug>/`** and merges **into the feature branch first** — not directly to the **default branch** — unless an explicit exception is documented for hotfix flows.
- **Feature-complete gate (default-branch PR):** For a given **`FR-NNNN`**, treat **feature implementation** as **complete** when every **`### T-FR-NNNN-xx`** section in **`tasks/feature-history/FR-NNNN-<slug>/tickets.md`** has **TEST**, **DEV**, and **VAL** = **`done`** in **`tasks/ticket-progress.md`**. Until then, keep all product implementation on **`feat/FR-NNNN-<slug>`** — merge ticket/stage branches there, revalidate, push the feature branch, update **`CURRENT.md`** / **`handoffs/`**, and run **`/identify-frontier`** / **`/develop-frontier`** for the next tickets — **do not** open a **pull request from `feat/FR-NNNN-<slug>` to the default branch** for partial delivery. **Documented exceptions** (hotfix, agreed slice in **`handoffs/`** or **`90-closeout.md`**, or explicit team decision) may override this default.
- **`finish-feature`:** After the **feature-complete gate** is met, merges any remaining ticket/stage branches into **`feat/FR-NNNN-<slug>`**, runs validation there, pushes the feature branch, and opens (or updates) a **pull request to the default branch** for **human** review and merge. In the **same run**, when the gate passes, **mandatory feature closeout** per **`.cursor/skills/finish-feature/SKILL.md` §5–§7**: **`90-closeout.md`**, **`REGISTRY.md`** → **`done`**, feature **`README.md`**, **`tasks/ticket-progress.md`** (**Parallel streams** / **Current focus**), **`/explain-feature`** before/after HTML under the feature-history folder, fresh-context **`/update-manual`** for **`docs/manual/`**, and **`handoffs/YYYY-MM-DD-finish-feature.md`** — do **not** defer closeout to the merger or **`/feature-request-continue`**. If the integration PR is **already merged**, skip opening a PR but still run closeout when artifacts are missing or stale. If the gate is **not** met, **do not** open a default-branch PR, write **`90-closeout.md`**, or run the feature-end explain-feature/manual update — keep work on **`feat/FR-NNNN-<slug>`** only. It does **not** replace **`finish-frontier`** for workflows that still integrate straight to the default branch.
- **`CURRENT.md`:** keep the feature integration branch’s file accurate through **`finish-feature`**; the **PR merge to `main`** should drop **`CURRENT.md`** from **`main`** so the default branch stays neutral (**`feature-request`** skill).
- **Continue / milestone handoffs** for a feature belong **primarily** under **`tasks/feature-history/FR-NNNN-<slug>/handoffs/`** (e.g. `YYYY-MM-DD-continue.md`, `YYYY-MM-DD-milestone.md`). Optionally mirror a one-line pointer in **`tasks/handoffs/`** if the team wants a global inbox — the **authoritative** narrative for “what’s next on this feature” stays next to that feature’s artifacts.
- **Diaries:** **`serial-diary.md`** is one append-only chain for serial work; parallel agents write only under **`parallel/<stream>.md`**. Periodically (and at closeout), produce **`DIARY.md`** in the same feature folder: **merge** content from **`serial-diary.md`** and **`parallel/*.md`** into **one** file ordered as a **stack** — **newest entries at the top** — each block labeled with **source file**, **date**, and **git ref** (branch or SHA) when known so git history stays traceable. **Do not delete** the underlying **`serial-diary.md`** / **`parallel/`** files when generating **`DIARY.md`**; they remain the raw audit log.
- **Never auto-delete remote branches** used in feature or ticket work (**`feat/*`**) — they record how the work evolved. Removing remotes or force-deleting history requires **explicit human** approval. Local worktree directories may be removed only when safe and the **remote** branch is retained.

### 3. Self-improvement

After user corrections, append **`tasks/lessons.md`**.

### 4. Verification

Do not mark **VAL** `done` without meeting the ticket’s verification criteria.

For web UI work, required **Web UI validation** in **Implementation standards** must pass or have a documented exception before **VAL** is marked `done`.

### 5. Task management

- Update **`tasks/ticket-progress.md`** Progress rows for the ticket you own — **only your row** when multiple agents run in parallel.
- When several features are active, keep **`Parallel streams`** (in **`ticket-progress.md`**) accurate, or add a dated line to **`tasks/handoffs/`** naming each stream’s **ticket id**, **`FR-NNNN`**, branch, and **`.worktrees/…`** path.
- When a feature is **`complete`** in **`REGISTRY.md`**, **remove** that **`FR-NNNN`** from **`Parallel streams`** (do not leave it as active work); write or refresh **`tasks/feature-history/FR-NNNN-<slug>/90-closeout.md`**, run or verify the feature-end **`/explain-feature`** artifact and **`/update-manual`** pass, and align **Current focus** with the next incomplete ticket — same contract as **`feature-request`** skill **Closeout** and **`/feature-request-continue`** post-merge hygiene.
- When a ticket completes, update the **DAG Overview** **`triadDone`** classes in **`docs/design/tickets-initial.md`** (per **`docs/design/documentation-style.md`** — e.g. `TFR0007_01_TEST` … `triadDone`).

### 6. Session end

Optional **Suggested next step** for the next worker (from **Current focus** + what you finished).

### 7. Ticket completion — commit, push, PR

When **TEST/DEV/VAL** are all **`done`**:

1. **Commit** — Conventional message; optional metrics footer per **`.cursor/skills/commit-with-ai-metrics/SKILL.md`** / **`/commit-with-metrics`**.
2. **Push** — `git push -u origin HEAD` (or as required).
3. **Open PR** — Prefer `gh pr create`; if unavailable, note what blocked it. Under the **feature-branch workflow** (**§2d**), each completed ticket/stage merges into **`feat/FR-NNNN-<slug>`**; ticket-level PRs (if any) use **base** **`feat/FR-NNNN-<slug>`** and **head** the feature-prefixed ticket/stage branch. The **`feat/FR-NNNN-<slug>`** → default branch PR is opened **only** when **§2d** **feature-complete gate** is met — **`finish-feature`** then opens (or updates) that **PR**; still **no** automated push to the default branch. For **direct-to-main** integration, use the default branch as **base** for ticket PRs per team policy.

---

## Finish-frontier merge notes

**`finish-feature`** uses the same **union** rules for shared tracker files when merging **ticket** branches into **`feat/FR-NNNN-<slug>`**; it opens a PR to the default branch **only after** **§2d** **feature-complete gate** — it **never** pushes the default branch from automation.

When merging multiple ticket/stage branches (via **`finish-frontier`** into **`main`**), resolve **shared** files (e.g. `docs/design/tickets-initial.md` mermaid `triadDone` classes) by **union** of completed tickets.

After merge resolution, run a mandatory full revalidation gate on the **target** branch (**`main`** for **`finish-frontier`**; **`feat/FR-NNNN-<slug>`** when finishing a feature) before pushing **that** branch:

- If all required checks pass: **`finish-frontier`** may push the default branch; **`finish-feature`** pushes only **`feat/FR-NNNN-<slug>`** and relies on the **PR to the default branch** for human merge (opened only after **§2d** **feature-complete gate**) — never push the default branch from automation in the feature workflow.
- If any check fails or a requirement is unmet, do **not** push the green integration branch; create/update a blocker as the primary ticket in `tasks/ticket-progress.md`, set `Session status` to `blocked`, and for **`finish-frontier`** push the integration state to `broken-main` until the blocker reaches VAL `done`.

---

## Further reading

- **`.skeleton/CHANGELOG.md`** — after **`./sync-skeleton`**, read **After sync: read the changelog** and **`[Unreleased]` → Template** / **Deprecations** for **`Consumer manual:`** / **`[consumer manual]`** follow-ups
- **`docs/skeleton-project-overlays.md`** — **`*.project.*`** companion files for repo-specific rules next to template-synced paths
- **`INIT.MD`** — clone, **`init-skeleton`**, **`sync-skeleton`**, **`init-project`**
- **`sync-skeleton`** skill / **`/sync-skeleton`** — run **`./sync-skeleton`** from the project root (see **`INIT.MD` → *Syncing template updates***)
- **`docs/design/documentation-style.md`** — ticket ids, traceability, writing rules
- **`.cursor/skills/feature-request/SKILL.md`** — full **`FR-NNNN`** stage contract
