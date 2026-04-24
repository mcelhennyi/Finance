#!/usr/bin/env python3
"""Launch the Finance Hub web interface.

Usage:
  python run.py
  FINANCE_PORT=9000 python run.py  # arbitrary override; default 3503 — docs/PORTS.md
  FINANCE_DB_URL=sqlite:///./finance.db python run.py
"""

import sys
from pathlib import Path

# Allow running from project root without installing
sys.path.insert(0, str(Path(__file__).parent / "src"))

from finance.web.app import main

if __name__ == "__main__":
    main()
