# Finance Hub AI context overlay

Shared project process overlay for Finance Hub. Load after
**`docs/ai-context.md`** and before agent-specific overlays.

## Stack and command environment

- Backend: Python / FastAPI package under **`src/`**, served by uvicorn in the
  **`api`** Compose service.
- Frontend: React 18 / Vite / TypeScript under **`frontend/`**, served by the
  **`web`** Compose service.
- Persistence: local SQLite in the **`finance-db`** Docker volume for the dev
  stack; seed inputs live under **`data/seed-statements/`**.
- Documentation: MkDocs Material from **`docs/`**; local docs port is
  **`3504`** per **`docs/PORTS.md`**.
- Prefer Docker Compose for build, test, lint, package-manager scripts, and dev
  servers. Host-local commands are exceptions and should be noted in the ticket
  diary or handoff.

## Validation commands

Use these as the default checks unless a ticket narrows or expands the gate.

| Surface | Command |
|---------|---------|
| Backend tests | `docker compose run --rm -v "$(pwd):/app" -w /app api sh -c "pip install -e /app pytest -q && python -m pytest tests/ -q"` |
| Frontend lint / unit tests / build | `docker compose run --rm -v "$(pwd)/frontend:/app" -w /app web sh -c "npm run lint && npm test && npm run build"` |
| Frontend merge-marker guard | `./scripts/check-frontend-no-merge-markers.sh` |
| Dev stack | `./scripts/dev.sh` |
| Dev stack with seed data | `./scripts/dev.sh --fresh --seed` |

## Web UI validation

Local browser targets:

| Target | URL |
|--------|-----|
| API | `http://localhost:3500` |
| Vite app | `http://localhost:3501` |
| Production UI compose | `http://localhost:3502` |
| MkDocs | `http://localhost:3504` |

For user-visible web UI work, scripted checks are not enough for **VAL**.
After the relevant stack is running, use a browser-capable tool (Codex in-app
browser, Playwright, or equivalent) to inspect the rendered app at desktop and
phone-sized viewports. Capture screenshots or describe the rendered states in
the ticket diary or handoff.

Minimum route/state matrix for UI changes:

| Surface | Navigate by | States to inspect |
|---------|-------------|-------------------|
| Dashboard | Header brand / **Dashboard** nav | Upload zone, filters, stat cards, charts, transaction table, loading and empty data states |
| Unified view | **Unified view** nav | Month selection, summary cards, alert states, budget/actual reconciliation, responsive layout |
| Budget | **Budget** nav | Month and cutoff controls, allocation table, docs modal, cash-flow graph panel, save/error states, narrow viewport fit |
| BBD | **BBD** nav | Scenario fields, story charts, docs modal, export controls, optional spatial view, reduced-motion behavior when relevant |
| Settings | Gear button | Settings tree, merchant display editor, save/clear flows, empty and error states |

Always check that navigation remains reachable, text does not overlap, and the
page is not blank after HMR or a reload. For graph or canvas-heavy work, verify
that the visual surface is nonblank and interactive at the inspected viewport.

## Traceability and tag areas

Project traceability prefix: **`FH`**. Use **`@FH-<area>-<number>`** only after
reserving the id in **`tasks/TAG-REGISTRY.md`**.

Area keys:

| Area | Scope |
|------|-------|
| `API` | FastAPI routes, request/response contracts, and service boundaries |
| `DATA` | Persistence, migrations, ingestion, seed data, and normalization |
| `UI` | React app shell, pages, components, browser behavior, and accessibility |
| `BUD` | Budget allocation, budget plans, and cash-flow graph behavior |
| `BBD` | Buy/Borrow/Die projection engine and experience |
| `DOC` | Design docs, process docs, and published MkDocs behavior |
| `OPS` | Docker, scripts, ports, CI, and local development environment |
