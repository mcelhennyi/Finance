# Profile server app

This skeleton design defines a generic local profile explorer for actor-driven projects. The app should serve the project's parseable actor/story graph so humans can inspect user profiles, roles, user stories, action clusters, handoffs, stakeholders, antagonists, guiding figures, and gaps.

## Command Contract

Implement the lifecycle under the skeleton `develop` helper:

```bash
./develop profiles up
./develop profiles down
./develop profiles restart
./develop profiles status
./develop profiles logs
./develop profiles diagnose
```

Recommended options:

| Option | Purpose |
|--------|---------|
| `PROFILE_SERVER_PORT` | Override the local port. |
| `PROFILE_SERVER_HOST` | Bind address, defaulting to loopback. |
| `PROFILE_GRAPH_ROOT` | Override `docs/design/actors/` for unusual projects. |
| `PROFILE_SERVER_WATCH=1` | Rebuild/reload when actor graph files change. |

The command should be safe for local development. It must not require production credentials, external network access, or real personal data.

The baseline skeleton implementation is intentionally local and dependency-free:

- `./develop profiles up` launches `scripts/profile_server.py` in the background, writes pid/log metadata under `.tmp/profile-server/`, and prints the local URL plus graph root.
- `./develop profiles status` reports whether the recorded local server process is still running.
- `./develop profiles restart` performs a clean stop/start cycle against the same graph root and port.
- `./develop profiles logs` tails the local server log.
- `./develop profiles diagnose` prints machine-readable JSON diagnostics and exits non-zero for graph errors such as missing indexed actor/story Markdown or missing edge handlers.
- `./develop profiles down` terminates the recorded profile server process and removes stale pid state without touching project graph data.

The lifecycle smoke check is:

```bash
python3 scripts/profile_server_lifecycle_smoke.py --require-graph
```

The graph explorer smoke check is:

```bash
python3 scripts/profile_server_ui_smoke.py --require-graph
```

The project-extension smoke check is:

```bash
python3 scripts/profile_server_extensions_smoke.py
```

## Data Contract

The generic server reads from `docs/design/actors/`:

| File | Contract |
|------|----------|
| `actors/*.md` | One actor per file with frontmatter `id`, `kind`, `title`, `roles`, `status`, and seed anchors. |
| `stories/*.md` | One story per actor/action slice with `id`, `actor_id`, `action_id`, `availability`, and story metadata. |
| `edges.jsonl` | Typed story-to-story relations such as `handoff`, `variant_of`, `enables`, `blocks`, and `conflicts`. |
| `index.json` | Generated lookup table for actors, stories, actions, edge adjacency, story-key lookup, and guiding figures. |
| `actor-graph.json` | Flat app-readable export for static HTML/JS loading. |
| `pages/*.md` | Optional project-owned Markdown pages with simple frontmatter for routes, evidence links, screenshots, Storybook links, and test reports. |

Missing role stories under an `action_id` are gaps, not denial. Denial must be explicit with `availability: denied`.

Actor, story, and project-page Markdown remains the human-authorable source, but the server exposes it as structured UI data through `/api/document?path=...`. That response includes the safe graph-relative path, parsed frontmatter, title, heading sections, paragraphs, list items, and the original Markdown for compatibility. UI code should prefer the structured fields for cards, modals, filters, search, and traceability; raw Markdown rendering is a fallback, not the primary detail experience.

CLI and UI diagnostics share the same structured records:

| Diagnostic | Severity | Meaning |
|------------|----------|---------|
| `missing_graph_file` | warning or error | A required graph artifact is absent; JSON artifacts are errors, text files are warnings. |
| `invalid_json` | error | A generated JSON graph file cannot be parsed. |
| `missing_markdown_file` | error | `index.json` points at an actor/story Markdown file that does not exist. |
| `missing_edge_handler` | error | A story edge references a story id absent from the index. |
| `stale_generated_data` | warning | Actor/story Markdown or edge files are newer than generated JSON artifacts. Project pages are loaded dynamically and do not require index regeneration. |

## Generic UI

The default UI should include:

- A 3D graph of actors, roles, user stories, action clusters, stakeholders, antagonists, guiding figures, and typed edges.
- A viewport-fitting graph region: top bars may remain fixed, but the graph should consume the remaining visible screen and side panels should scroll independently so users do not need to scroll the page to see the graph.
- Filters for actor class, role, action, availability, coverage, edge type, and status.
- Actor, story, action, role, edge, and project-page detail modals that render parsed frontmatter and Markdown sections as readable cards rather than dumping raw Markdown.
- Story detail modals should lead with a natural intent sentence derived from the actor, trigger, and expected flow; internal trace keys such as `story/...` belong in queryable facts, not the human top line.
- Primitive detail modals should be understandable without opening source files: actors explain need/routine/boundary, roles explain permission identity, stories explain trigger/action/target/surface/state/outcome/time/evidence, and actions explain the authorization-grade capability in the shape `require_authorization(actor, action, target)`.
- Upper-right summary counts for actors, stories, actions, and edges should be clickable and open list/table modals; each row should use plain-English labels and link back into the same detail modal navigation trail.
- History-backed modal navigation: graph clicks and modal relationship buttons should push addressable modal entries, and users should be able to move backward and forward with both browser navigation and modal top-bar Back/Forward buttons.
- A public explorer API for current graph state and opening node/modal entries so browser checks and per-project custom pages do not depend on canvas coordinates.
- A role availability matrix for the selected `action_id`.
- Gap views for missing handlers, missing role stories, unresolved conflicts, stale indexes, and missing graph files.
- A project pages panel backed by `/api/extensions` so project-specific context can appear without changing the skeleton viewer.
- Explanation mode that turns the selected subgraph into a concise human-readable system walkthrough.

Use a proven 3D/graph library for layout and interaction instead of hand-rolling graph physics when the project permits adding that dependency. The skeleton baseline keeps the viewer dependency-free and uses deterministic 3D projection rather than custom force physics so new projects can run it offline before choosing a frontend stack. Static file serving is enough for the baseline; a tiny local API is acceptable for Markdown rendering, live reload, search, or extension discovery.

## Project Extensions

Projects may add optional pages or renderers without forking the generic profile server:

| Extension | Suggested path |
|-----------|----------------|
| Project pages | `docs/design/actors/pages/*.md` |
| Extra filters | Additional frontmatter in actor/story files |
| Custom cards | `profiles.config.*` or a project adapter module |
| Product links | Route metadata in story frontmatter |
| Evidence links | Test reports, screenshots, design docs, or Storybook URLs |

The default app must continue working when no project extensions exist.

Project pages use simple frontmatter so they stay parseable without a YAML dependency:

```markdown
---
id: page-my-project-brief
title: My Project Brief
status: active
routes:
  - /member?role=member
evidence_links:
  - docs/design/seed-actor-profiles.md
screenshots:
  - docs/design/mockups/member-workspace.html
storybook_links:
  - storybook://actor-profile
test_reports:
  - scripts/profile_server_extensions_smoke.py
---
# My Project Brief

Explain the project-specific actor context here.
```

The extension boundary is deliberately narrow. The skeleton owns file discovery, safe Markdown serving, generic graph rendering, and structured diagnostics. Projects own the contents of `pages/*.md`, additional actor/story metadata keys, screenshots, routes, test links, and any future project adapter. A project should only fork the viewer when it needs a genuinely custom visual surface; otherwise it should add parseable metadata and let `/api/extensions` expose it.

## Implementation Ticket Template

Use these tickets when a project is ready to implement the profile server:

| Ticket | Title | Scope |
|--------|-------|-------|
| `T-FR-NNNN-xx` | Actor graph data contract and generated index | Establish `docs/design/actors/`, one file per actor/story, `edges.jsonl`, `index.json`, validation, and app-readable export. |
| `T-FR-NNNN-xx` | Profile server command lifecycle | Add `./develop profiles up/down/restart/status/logs`, config knobs, local port handling, and process cleanup. |
| `T-FR-NNNN-xx` | Generic 3D profile graph explorer | Build the HTML/JS UI for graph navigation, actor/story panels, action clusters, role availability, and explanation mode. |
| `T-FR-NNNN-xx` | Project extension hooks and validation | Add extension discovery, custom pages, stale-index checks, smoke tests, docs, and project override guidance. |

Keep the server generic in the skeleton. Project-specific pages and renderers should live in the consuming project.
