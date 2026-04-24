"""Statement parser plugins.

See Also: docs/design/services/ingestion-service/overview.md
"""

from finance.ingestion.parsers.amex import AmexParser
from finance.ingestion.parsers.chase import ChaseParser
from finance.ingestion.parsers.frost import FrostParser
from finance.ingestion.parsers.generic import GenericCSVParser
from finance.ingestion.parsers.pnc import PNCParser
from finance.ingestion.parsers.wells_fargo import WellsFargoParser

ALL_PARSERS = [
    ChaseParser(),
    AmexParser(),
    WellsFargoParser(),
    FrostParser(),
    PNCParser(),
    GenericCSVParser(),
]

__all__ = [
    "ChaseParser",
    "AmexParser",
    "WellsFargoParser",
    "FrostParser",
    "PNCParser",
    "GenericCSVParser",
    "ALL_PARSERS",
]
