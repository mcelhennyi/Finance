# FR-0003 — Intake

| Field | Value |
|------|--------|
| **Title** | BBD projection web front end |
| **Requester** (optional) | Product (via Cursor `/feature-request`) |
| **Target timeline** (optional) | After implementation: validate in Docker dev stack |
| **Constraints** | Follow Docker-first dev policy; reuse existing FastAPI + Vite/React patterns; do not persist user scenario data server-side unless a later FR requires it |
| **Success definition** (1–3 bullets) | A dedicated app page runs the same projection logic as `scripts/bbd_projection.py` via an API and shows yearly results plus terminal estate summary; optional Monte Carlo with server-enforced caps; clear disclaimer that outputs are illustrative, not advice |
| **Out of scope** | Tax-planning completeness beyond the script’s current model; mobile-native apps; exporting user configs to tenant storage |

**Raw details** (prose the user or PM provided):

Add a frontend page that serves as the UI for `/Users/ianmcelhenny/projects/finance/scripts/bbd_projection.py` — configurable scenario (TOML-equivalent inputs), deterministic run output, CSV-style yearly series in the UI, optional Monte Carlo summary, aligned with Finance Hub navigation and styling.
