import json
from typing import Any, Optional
import redis

from src.cache.base import BaseCache


class RedisCache(BaseCache):
    """Redis-backed cache implementation with automatic JSON serialization."""

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, redis_client: Optional[redis.Redis] = None):
        if redis_client is not None:
            self._redis = redis_client
        else:
            self._redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def get(self, key: str) -> Optional[Any]:
        try:
            val = self._redis.get(key)
            if val is None:
                return None
            if isinstance(val, (bytes, str)):
                return json.loads(val)
            return val
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            serialized = json.dumps(value)
            if ttl:
                return bool(self._redis.setex(key, ttl, serialized))
            return bool(self._redis.set(key, serialized))
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        try:
            return bool(self._redis.delete(key))
        except Exception:
            return False

    def clear(self) -> bool:
        try:
            return bool(self._redis.flushdb())
        except Exception:
            return False
