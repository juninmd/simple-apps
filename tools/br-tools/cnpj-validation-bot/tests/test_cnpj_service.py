import time
import pytest
import shutil
import tempfile

from src.cache.disk_cache import DiskCache
from src.services.cnpj_service import CNPJService, CNPJUnavailableError


@pytest.fixture
def temp_disk_cache():
    temp_dir = tempfile.mkdtemp()
    cache = DiskCache(directory=temp_dir)
    yield cache
    cache.close()
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_cnpj_service_caching_and_performance(temp_disk_cache):
    calls = []

    def mock_fetcher(clean_cnpj: str):
        time.sleep(0.15)  # Simulate slow external API call (150ms)
        calls.append(clean_cnpj)
        return {
            "cnpj": clean_cnpj,
            "razao_social": "Empresa Teste S.A.",
            "status": "ATIVA",
        }

    service = CNPJService(cache=temp_disk_cache, fetcher=mock_fetcher)
    raw_cnpj = "12.345.678/0001-95"

    # First lookup: Should call fetcher (uncached) and take >= 150ms
    start_1 = time.perf_counter()
    res1 = service.get_cnpj_info(raw_cnpj)
    duration_1_ms = (time.perf_counter() - start_1) * 1000

    assert res1["cnpj"] == "12345678000195"
    assert len(calls) == 1
    assert duration_1_ms >= 100  # Confirms slow initial fetch

    # Second lookup: Must be served from cache and return in < 100ms (Acceptance criteria)
    start_2 = time.perf_counter()
    res2 = service.get_cnpj_info(raw_cnpj)
    duration_2_ms = (time.perf_counter() - start_2) * 1000

    assert res2 == res1
    assert len(calls) == 1  # No additional API call made
    assert duration_2_ms < 100, f"Second lookup took {duration_2_ms:.2f}ms, which is not <100ms"


def test_invalid_cnpj_raises_error(temp_disk_cache):
    service = CNPJService(cache=temp_disk_cache)
    with pytest.raises(ValueError):
        service.get_cnpj_info("123")


def test_no_data_source_fails_explicitly_and_invents_nothing(temp_disk_cache):
    service = CNPJService(cache=temp_disk_cache)
    with pytest.raises(CNPJUnavailableError):
        service.get_cnpj_info("12.345.678/0001-95")
    # The failure must not be cached: nothing fabricated is stored for 24h.
    assert temp_disk_cache.get("cnpj:12345678000195") is None


def test_failed_fetch_is_not_cached(temp_disk_cache):
    def failing_fetcher(clean_cnpj: str):
        raise CNPJUnavailableError("upstream down")

    service = CNPJService(cache=temp_disk_cache, fetcher=failing_fetcher)
    with pytest.raises(CNPJUnavailableError):
        service.get_cnpj_info("12345678000195")
    assert temp_disk_cache.get("cnpj:12345678000195") is None
