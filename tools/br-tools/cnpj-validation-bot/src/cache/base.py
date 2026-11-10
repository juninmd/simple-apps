from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseCache(ABC):
    """Abstract base class defining the cache contract for key-value caching."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Retrieve a value from the cache by key.

        Returns None if key is not found or expired.
        """
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a key-value pair in the cache with an optional TTL in seconds.

        Returns True if successfully set, False otherwise.
        """
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Remove a key-value pair from the cache.

        Returns True if key was deleted, False otherwise.
        """
        pass

    @abstractmethod
    def clear(self) -> bool:
        """Clear all entries in the cache.

        Returns True if successful, False otherwise.
        """
        pass
