"""FastAPI application entry point.

See Also: docs/design/services/analysis-service/overview.md
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import filters, ingest, merchant_names, metrics, transactions
from finance.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Finance Hub API",
    version="0.1.0",
    description="Personal finance management — ingest, query, and analyze your financial data.",
    lifespan=lifespan,
)

_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3501,http://localhost:3502,http://localhost:3503",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(filters.router, prefix="/api")
app.include_router(merchant_names.router, prefix="/api")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def serve() -> None:
    """Entry point for the `finance-api` CLI command."""
    import uvicorn

    port = int(os.environ.get("FINANCE_PORT", 3500))
    debug = os.environ.get("FINANCE_DEBUG", "false").lower() == "true"
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        reload_dirs=["src"] if debug else None,
    )


if __name__ == "__main__":
    serve()
