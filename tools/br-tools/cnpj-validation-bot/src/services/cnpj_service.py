import re
from typing import Any, Callable, Dict, Optional

from src.cache.base import BaseCache


class CNPJUnavailableError(RuntimeError):
    """Raised when no real CNPJ data source is configured or the lookup fails."""


class CNPJService:
    """Service to look up CNPJ details with integrated caching layer."""

    CACHE_TTL_SECONDS = 86400  # Default 24h cache TTL

    def __init__(self, cache: BaseCache, fetcher: Optional[Callable[[str], Dict[str, Any]]] = None):
        self.cache = cache
        self.fetcher = fetcher or self._default_fetcher

    @staticmethod
    def sanitize_cnpj(cnpj: str) -> str:
        """Strip non-numeric characters from CNPJ string."""
        return re.sub(r"\D", "", cnpj)

    def _default_fetcher(self, clean_cnpj: str) -> Dict[str, Any]:
        """No real data source is configured: fail instead of inventing company data."""
        raise CNPJUnavailableError(f"No CNPJ data source configured; cannot look up {clean_cnpj}")

    def get_cnpj_info(self, cnpj: str, ttl: Optional[int] = None) -> Dict[str, Any]:
        """Look up CNPJ business details with cache check.

        Normalizes CNPJ formatting to ensure cache key consistency.
        """
        clean_cnpj = self.sanitize_cnpj(cnpj)
        if not clean_cnpj or len(clean_cnpj) != 14:
            raise ValueError(f"Invalid CNPJ length/format: {cnpj}")

        cache_key = f"cnpj:{clean_cnpj}"

        cached_data = self.cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        data = self.fetcher(clean_cnpj)
        effective_ttl = ttl if ttl is not None else self.CACHE_TTL_SECONDS
        self.cache.set(cache_key, data, ttl=effective_ttl)
        return data
