import os
import json
import time
from typing import Any, Optional, Dict

DEFAULT_CACHE_DIR = os.path.expanduser("~/.cache/br-feriado-checker")
DEFAULT_CACHE_FILE = os.path.join(DEFAULT_CACHE_DIR, "cache.json")
DEFAULT_TTL = 86400 * 30  # 30 days default TTL for location and holiday data


class CacheManager:
    """Manages file-based JSON caching with TTL support."""

    def __init__(self, cache_file: Optional[str] = None, default_ttl: int = DEFAULT_TTL):
        self.cache_file = cache_file or os.environ.get("BR_FERIADO_CACHE_FILE", DEFAULT_CACHE_FILE)
        self.default_ttl = default_ttl
        self.cache_dir = os.path.dirname(self.cache_file)

    def _ensure_dir(self):
        if self.cache_dir and not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)

    def _load_cache(self) -> Dict[str, Any]:
        if not os.path.exists(self.cache_file):
            return {}
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save_cache(self, data: Dict[str, Any]):
        self._ensure_dir()
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except OSError:
            pass

    def get(self, key: str, ignore_ttl: bool = False) -> Optional[Any]:
        """
        Retrieve value for key if present and not expired.
        If ignore_ttl is True, return stored value even if expired (useful for offline fallback).
        """
        cache_data = self._load_cache()
        entry = cache_data.get(key)
        if not entry or not isinstance(entry, dict):
            return None

        timestamp = entry.get("timestamp", 0)
        ttl = entry.get("ttl", self.default_ttl)

        if not ignore_ttl and (time.time() - timestamp > ttl):
            return None

        return entry.get("value")

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Store value for key with timestamp and ttl."""
        cache_data = self._load_cache()
        cache_data[key] = {
            "timestamp": time.time(),
            "ttl": ttl if ttl is not None else self.default_ttl,
            "value": value
        }
        self._save_cache(cache_data)

    def delete(self, key: str):
        """Remove a single key from cache."""
        cache_data = self._load_cache()
        if key in cache_data:
            del cache_data[key]
            self._save_cache(cache_data)

    def clear(self):
        """Clear all cached entries."""
        if os.path.exists(self.cache_file):
            try:
                os.remove(self.cache_file)
            except OSError:
                pass
