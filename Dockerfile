# ── Base ──────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src/ ./src/

RUN pip install --no-cache-dir -e .

# ── Development ───────────────────────────────────────────────────────────────
FROM base AS dev

RUN pip install --no-cache-dir watchdog

EXPOSE 8000

ENV FINANCE_DEBUG=true \
    FINANCE_PORT=8000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# uvicorn --reload watches src/ for changes
CMD ["python", "-m", "uvicorn", "api.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--reload", "--reload-dir", "src"]

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS prod

RUN pip install --no-cache-dir gunicorn

EXPOSE 8000

ENV FINANCE_DEBUG=false \
    FINANCE_PORT=8000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

CMD ["gunicorn", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "api.main:app"]
