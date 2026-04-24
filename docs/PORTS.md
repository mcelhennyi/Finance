# Finance Hub — port registry

Host ports for this repo start at **3500** and increase by **1** for each distinct process or entrypoint. When you add a new long-running service (HTTP server, dev docs, etc.), assign the next free port and document it here.

| Port | Service | How it is started | Notes |
|------|---------|-------------------|--------|
| **3500** | FastAPI (`api.main`) | `finance-api`, `docker compose`, `uvicorn api.main:app` | Default `FINANCE_PORT` when not using Docker. In Compose, host `3500` is mapped to container port **8000** (uvicorn still listens on 8000 inside the container). |
| **3501** | React / Vite dev UI | `npm run dev` in `frontend/`, `docker compose` **web** service (dev) | Vite listens on **3501** (host and container). |
| **3502** | Nginx (production UI) | `docker compose -f docker-compose.prod.yml` **web** service | Container listens on **80**; host maps **3502→80**. API CORS for this UI: `http://localhost:3502`. |
| **3503** | Flask UI (legacy) | `python run.py` | Default `FINANCE_PORT` in `finance.web.app`. |
| **3504** | MkDocs dev server | `mkdocs serve` | Set via `dev_addr` in `mkdocs.yml`. |
| **3505** | *next available* | — | Use for the next service, then extend this table. |

## Docker vs local defaults

- **Between containers**, the API remains `http://api:8000` (service name + internal listen port). Only published (host) ports use the 35xx range.
- **`VITE_API_TARGET`**: leave as `http://api:8000` in Compose; for local Vite without Docker, the dev server defaults to proxying to `http://localhost:3500`.

## Quick reference

| URL | Use |
|-----|-----|
| http://localhost:3500 | REST API (`/health`, `/api/...`) |
| http://localhost:3501 | Vite app (dev) |
| http://localhost:3502 | Static web + API proxy (prod compose) |
| http://localhost:3503 | Flask app (`run.py`) |
| http://localhost:3504 | Documentation site (`mkdocs serve`) |

See also: `docker-compose.yml`, `docker-compose.prod.yml`, `frontend/vite.config.ts`, `src/api/main.py`.
