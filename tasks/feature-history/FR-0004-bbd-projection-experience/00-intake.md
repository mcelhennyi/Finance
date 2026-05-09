# FR-0004 — Intake

| Field | Value |
|------|--------|
| **Title** | BBD projection immersive educational experience |
| **Requester** (optional) | Product (via `/feature-request`) |
| **Target timeline** (optional) | After **`FR-0003`** baseline merge; implementation via **`feat/FR-0004-bbd-projection-experience`** |
| **Constraints** | Docker-first dev (`./develop` / Compose per repo policy); no personalized tax/legal claims; privacy — no extra logging of scenario amounts; bundle size — lazy-load WebGL; maintain **`recharts`** as primary 2D stack unless VAL proves insufficient |
| **Success definition** (1–3 bullets) | **(1)** First-time readers can understand *what the simulation did* and *why rows move* using on-page teaching surfaces (not only hover tips). **(2)** Primary outputs are visual narratives (time series, comparisons, Monte dispersion) with tables secondary or collapsible. **(3)** A fixed **bottom-center control dock** houses **Docs**, **Generate report** (or export), and primary run actions so the page feels operable like a console. |
| **Out of scope** | Backend Monte Carlo algorithm changes; estate-law correctness beyond existing engine heuristics; mobile-native apps; exporting to formats beyond what the page already supports unless trivial |
| **Links** | [`tasks/feature-history/FR-0003-bbd-projection-ui/`](../FR-0003-bbd-projection-ui/README.md), [`frontend/src/types.ts`](../../../frontend/src/types.ts) **`BbdRunResponse`**, [`scripts/bbd-projection/README.md`](../../../scripts/bbd-projection/README.md) |

**Raw details** (prose the user or PM provided):

The current BBD UI output feels sparse and hard to ingest. The user wants **maximum approachable context**: educational copy, insights, hints, and **many charts / distinctive visuals** using strong libraries. They want a **3D or “4D”** feel — interpreted here as **spatial mapping** (e.g. trajectory through time, stacked dimensions, interactive camera) plus **time as an explicit navigable axis**, not literal physics simulation. A **frozen/floating bottom bar** should act as a **control center**: move **Docs** and **Generate report** there (bottom center), keeping the main canvas for the story and inputs above.
