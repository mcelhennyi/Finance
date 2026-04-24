# ── Base ──────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# System deps: none needed for CSV-only Phase 1
# (pytesseract / poppler added when OCR phase is implemented)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Copy dependency metadata first for layer caching
COPY pyproject.toml ./
COPY src/ ./src/

# Install the package and its runtime deps
RUN pip install --no-cache-dir -e ".[dev]"

# ── Development ───────────────────────────────────────────────────────────────
FROM base AS dev

# watchdog gives the Werkzeug reloader reliable file-system events on Linux
RUN pip install --no-cache-dir watchdog

# Expose dev port
EXPOSE 5000

# Flask reloader watches src/ for Python changes; templates reload on every request
ENV FLASK_DEBUG=1 \
    FINANCE_DEBUG=true \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

CMD ["python", "run.py"]

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS prod

# gunicorn is the production WSGI server
RUN pip install --no-cache-dir gunicorn

EXPOSE 5000

ENV FINANCE_DEBUG=false \
    FLASK_DEBUG=0 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 4 workers, timeout 120s; adjust --workers based on CPU count
CMD ["gunicorn", \
     "--workers", "4", \
     "--bind", "0.0.0.0:5000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "finance.web.app:app"]
