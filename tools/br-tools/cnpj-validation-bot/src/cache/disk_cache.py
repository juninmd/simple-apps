import os
from typing import Any, Optional
import diskcache

from src.cache.base import BaseCache


class DiskCache(BaseCache):
    """Disk-backed cache implementation using diskcache."""

    def __init__(self, directory: Optional[str] = None):
        if directory is None:
            directory = os.path.join(os.getcwd(), ".cache_data")
        self.directory = directory
        self._cache = diskcache.Cache(self.directory)

    def get(self, key: str) -> Optional[Any]:
        try:
            return self._cache.get(key, default=None)
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            return bool(self._cache.set(key, value, expire=ttl))
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        try:
            return bool(self._cache.delete(key))
        except Exception:
            return False

    def clear(self) -> bool:
        try:
            self._cache.clear()
            return True
        except Exception:
            return False

    def close(self) -> None:
        try:
            self._cache.close()
        except Exception:
            pass
