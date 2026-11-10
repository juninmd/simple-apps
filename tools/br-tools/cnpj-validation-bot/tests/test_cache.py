import os
import shutil
import tempfile
import time
import pytest
from unittest.mock import MagicMock

from src.cache.disk_cache import DiskCache
from src.cache.redis_cache import RedisCache
from src.cache.hybrid_cache import HybridCache


@pytest.fixture
def temp_disk_cache():
    temp_dir = tempfile.mkdtemp()
    cache = DiskCache(directory=temp_dir)
    yield cache
    cache.close()
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def mock_redis():
    mock_r = MagicMock()
    storage = {}

    def get_val(k):
        return storage.get(k)

    def set_val(k, v):
        storage[k] = v
        return True

    def setex_val(k, ttl, v):
        storage[k] = v
        return True

    def del_val(k):
        return storage.pop(k, None) is not None

    def flush():
        storage.clear()
        return True

    mock_r.get.side_effect = get_val
    mock_r.set.side_effect = set_val
    mock_r.setex.side_effect = setex_val
    mock_r.delete.side_effect = del_val
    mock_r.flushdb.side_effect = flush

    return RedisCache(redis_client=mock_r)


def test_disk_cache_operations(temp_disk_cache):
    assert temp_disk_cache.get("key1") is None
    assert temp_disk_cache.set("key1", {"data": 123}, ttl=60) is True
    assert temp_disk_cache.get("key1") == {"data": 123}
    assert temp_disk_cache.delete("key1") is True
    assert temp_disk_cache.get("key1") is None


def test_redis_cache_operations(mock_redis):
    assert mock_redis.get("key1") is None
    assert mock_redis.set("key1", {"name": "test"}, ttl=300) is True
    assert mock_redis.get("key1") == {"name": "test"}
    assert mock_redis.delete("key1") is True
    assert mock_redis.get("key1") is None


def test_hybrid_cache_fallback(temp_disk_cache):
    # Setup primary failing/empty redis cache
    failing_redis = MagicMock()
    failing_redis.get.return_value = None
    failing_redis.set.return_value = False
    failing_redis.setex.return_value = False

    redis_cache = RedisCache(redis_client=failing_redis)
    hybrid = HybridCache(primary=redis_cache, fallback=temp_disk_cache)

    # Pre-populate disk cache
    temp_disk_cache.set("cnpj:12345678000195", {"razao": "Empresa Teste"})

    result = hybrid.get("cnpj:12345678000195")
    assert result == {"razao": "Empresa Teste"}
