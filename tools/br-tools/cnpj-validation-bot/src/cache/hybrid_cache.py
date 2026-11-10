from typing import Any, Optional

from src.cache.base import BaseCache


class HybridCache(BaseCache):
    """Multi-tiered cache combining primary cache (e.g. Redis) with fallback cache (e.g. DiskCache)."""

    def __init__(self, primary: BaseCache, fallback: BaseCache):
        self.primary = primary
        self.fallback = fallback

    def get(self, key: str) -> Optional[Any]:
        # Try primary cache first
        val = self.primary.get(key)
        if val is not None:
            return val

        # Fallback to secondary cache
        val = self.fallback.get(key)
        if val is not None:
            # Backfill primary cache
            self.primary.set(key, val)
            return val

        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        res_primary = self.primary.set(key, value, ttl=ttl)
        res_fallback = self.fallback.set(key, value, ttl=ttl)
        return res_primary or res_fallback

    def delete(self, key: str) -> bool:
        res_primary = self.primary.delete(key)
        res_fallback = self.fallback.delete(key)
        return res_primary or res_fallback

    def clear(self) -> bool:
        res_primary = self.primary.clear()
        res_fallback = self.fallback.clear()
        return res_primary or res_fallback
