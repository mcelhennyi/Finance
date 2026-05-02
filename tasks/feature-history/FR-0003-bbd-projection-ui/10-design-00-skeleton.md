# FR-0003 — Design (level 0, skeleton)

## Purpose

Let users explore Buy–Borrow–Die style projections inside Finance Hub without using the CLI, by exposing the existing Python simulation through a typed HTTP API and a React page — preserving parity with [`scripts/bbd_projection.py`](../../../scripts/bbd_projection.py) behavior for the same numeric inputs.

## Actors

- **End user:** adjusts scenario parameters, triggers runs, reads tables/charts and disclaimers.

- **API service:** validates payloads, invokes simulation, applies resource limits on Monte Carlo.

## Public surfaces (skeleton)

Only contracts: module boundaries, routes, payloads. Implementation is ticket work.

| Surface | Kind | Contract (signature / schema sketch) | Owner (logical) |
|---------|------|----------------------------------------|-----------------|
| `bbd_projection` core module | Python import | `Scenario`, `YearState`, `project(scenario)`, `monte_carlo(scenario, n_trials, seed)`, estate helpers aligned with script | Backend |
| `POST /api/bbd-projection/run` | REST | Request: JSON equivalent of TOML sections (`timing`, `income`, `taxes`, `expenses`, `savings`, `borrowing`, `strategy`, `properties[]`, `private_equity[]`) + options `{ monte_carlo_trials?: int, csv?: bool }`; Response: `{ schedule: YearStateRow[], terminal_estate?: { sell_path, bbd_path }, monte_carlo?: McSummary }` (exact field names nailed in TEST phase) | Backend |
| `BbdProjectionPage` | React | Form sections mirroring config groups; displays schedule table + key KPIs + optional MC stats; loading/error states; optional local presets; contextual “Understand outcomes ›” links into the modal guide (**`FR-0003`** follow-up UX) | Frontend |
| `BbdGuideContent` / `BbdDocsProvider` | React | Modal overlay for the long-form operator guide (**not** a standalone app route after follow-up): scroll position persists in **`localStorage`** when opened from restore entry points (`openDocs()`); anchored sections for deep-links from contextual buttons (`openDocs(section)`) (**`FR-0003`**) | Frontend |
| Floating “BBD docs” control | Layout | Lower-right launcher (dock-style) invoking `openDocs()`; replaces a primary-nav **BBD guide** tab when modal-only UX is adopted (**`FR-0003`** follow-up) | Frontend |
| `GET /api/bbd-projection/default-scenario` | REST | Returns JSON matching the SPA schema for the operator’s seeded default (**`FINANCE_BBD_DEFAULT_YAML`**, typically **`data/seed-statements/ian.yaml`** in compose) (**`FR-0003`** follow-up DEV) | Backend |
| Navigation | Layout | `AppPage` key and nav entry for **`bbd`** projection tool; auxiliary guide via modal + launcher, not a separate **`bbd-guide`** page (**`FR-0003`** + follow-up) | Frontend |

## Data in / out

| Input | Output | Storage |
|-------|--------|---------|
| Scenario JSON from browser | JSON schedule rows + summaries | None required (ephemeral); optional future persistence is out of scope for this FR |

## Open questions

- **DESIGN-GAP (resolve in TEST):** Exact OpenAPI schema for nested `properties` / `private_equity` arrays and enums (`pe_exit_treatment`).

- **Monte Carlo safety:** Maximum `n_trials` and request timeout enforced server-side.

- **Parity checks:** Shared golden-vector tests between CLI fixture and API response for one canned scenario.
