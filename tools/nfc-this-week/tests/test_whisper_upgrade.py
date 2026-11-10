"""Test suite for Whisper Base model upgrade for noisy receipts."""

import hashlib
import json
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.whisper_upgrade.downloader import (
    ChecksumMismatchError,
    DownloadError,
    ModelDownloader,
)
from src.whisper_upgrade.metrics import compute_wer, evaluate_fixtures
from src.whisper_upgrade.models import WHISPER_MODELS, WhisperModelSpec
from src.whisper_upgrade.options import OptionsError, WhisperOptions
from src.whisper_upgrade.transcriber import (
    LoadTimeExceededError,
    WhisperTranscriber,
)


@pytest.fixture
def fixtures_data() -> list[dict]:
    """Load the 10 low-light/noisy receipt fixtures."""
    fixtures_path = Path(__file__).parent / "fixtures" / "receipt_fixtures.json"
    with open(fixtures_path, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def temp_cache_dir(tmp_path: Path) -> Path:
    """Provide a temporary directory for downloaded models."""
    cache = tmp_path / "cache"
    cache.mkdir()
    return cache


@pytest.fixture
def temp_config_dir(tmp_path: Path) -> Path:
    """Provide a temporary directory for config."""
    config = tmp_path / "config"
    config.mkdir()
    return config


class TestModelSpecifications:
    """Verify specifications of default and upgrade Whisper models."""

    def test_whisper_models_presence(self):
        assert "tiny.en" in WHISPER_MODELS
        assert "base.en" in WHISPER_MODELS

    def test_base_en_is_optional_download(self):
        base_spec = WHISPER_MODELS["base.en"]
        assert base_spec.is_optional_download is True
        assert 140.0 <= base_spec.size_mb <= 145.0  # ~142MB

    def test_tiny_en_is_bundled_default(self):
        tiny_spec = WHISPER_MODELS["tiny.en"]
        assert tiny_spec.is_optional_download is False
        assert tiny_spec.size_mb < 80.0


class TestModelDownloader:
    """Verify download handling, checksum verification, and error paths."""

    def test_successful_download_with_checksum(self, temp_cache_dir: Path):
        content = b"fake-whisper-base-en-model-weights-content"
        hasher = hashlib.sha256(content)
        expected_hash = hasher.hexdigest()

        spec = WhisperModelSpec(
            name="test_base",
            size_bytes=len(content),
            size_mb=0.001,
            is_optional_download=True,
            download_url="https://example.com/test_base.pt",
            sha256_checksum=expected_hash,
        )

        downloader = ModelDownloader(cache_dir=temp_cache_dir)

        mock_response = MagicMock()
        mock_response.read.side_effect = [content, b""]
        mock_response.headers = {"Content-Length": str(len(content))}
        mock_response.__enter__.return_value = mock_response

        with patch("urllib.request.urlopen", return_value=mock_response):
            path = downloader.download(spec)
            assert path.exists()
            assert downloader.is_downloaded(spec)
            assert path.read_bytes() == content

    def test_checksum_mismatch_raises_error(self, temp_cache_dir: Path):
        content = b"corrupted-whisper-model-content"
        spec = WhisperModelSpec(
            name="test_corrupted",
            size_bytes=len(content),
            size_mb=0.001,
            is_optional_download=True,
            download_url="https://example.com/test_corrupted.pt",
            sha256_checksum="deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678",
        )

        downloader = ModelDownloader(cache_dir=temp_cache_dir)

        mock_response = MagicMock()
        mock_response.read.side_effect = [content, b""]
        mock_response.headers = {"Content-Length": str(len(content))}
        mock_response.__enter__.return_value = mock_response

        with patch("urllib.request.urlopen", return_value=mock_response):
            with pytest.raises(ChecksumMismatchError):
                downloader.download(spec)

        assert not downloader.is_downloaded(spec)

    def test_network_failure_handling(self, temp_cache_dir: Path):
        spec = WHISPER_MODELS["base.en"]
        downloader = ModelDownloader(cache_dir=temp_cache_dir)

        with patch("urllib.request.urlopen", side_effect=OSError("Network unreachable")):
            with pytest.raises(DownloadError):
                downloader.download(spec)


class TestOptionsToggle:
    """Verify options management and model toggle in user preferences."""

    def test_default_model_is_tiny(self, temp_cache_dir: Path, temp_config_dir: Path):
        downloader = ModelDownloader(cache_dir=temp_cache_dir)
        options = WhisperOptions(
            config_path=temp_config_dir / "options.json", downloader=downloader
        )
        assert options.selected_model_name == "tiny.en"

    def test_toggle_base_en_fails_when_not_downloaded(
        self, temp_cache_dir: Path, temp_config_dir: Path
    ):
        downloader = ModelDownloader(cache_dir=temp_cache_dir)
        options = WhisperOptions(
            config_path=temp_config_dir / "options.json", downloader=downloader
        )

        with pytest.raises(OptionsError, match="not downloaded"):
            options.toggle_model(use_base_en=True)

        assert options.selected_model_name == "tiny.en"

    def test_toggle_base_en_succeeds_when_downloaded(
        self, temp_cache_dir: Path, temp_config_dir: Path
    ):
        downloader = ModelDownloader(cache_dir=temp_cache_dir)
        # Create fake downloaded base.en file
        base_path = downloader.get_model_path(WHISPER_MODELS["base.en"])
        base_path.write_bytes(b"model-weights-fake")

        options = WhisperOptions(
            config_path=temp_config_dir / "options.json", downloader=downloader
        )
        assert options.is_base_en_available() is True

        selected = options.toggle_model(use_base_en=True)
        assert selected == "base.en"
        assert options.selected_model_name == "base.en"

        # Toggle back to tiny.en
        selected = options.toggle_model(use_base_en=False)
        assert selected == "tiny.en"

    def test_remove_base_en_resets_selected_model(
        self, temp_cache_dir: Path, temp_config_dir: Path
    ):
        downloader = ModelDownloader(cache_dir=temp_cache_dir)
        base_path = downloader.get_model_path(WHISPER_MODELS["base.en"])
        base_path.write_bytes(b"model-weights-fake")

        options = WhisperOptions(
            config_path=temp_config_dir / "options.json", downloader=downloader
        )
        options.toggle_model(use_base_en=True)
        assert options.selected_model_name == "base.en"

        options.remove_base_en()
        assert options.is_base_en_available() is False
        assert options.selected_model_name == "tiny.en"


class TestLoadTimeBenchmark:
    """Verify load time < 10.0s requirement on WiFi/SSD systems."""

    def test_normal_load_time_under_10s(self):
        spec = WHISPER_MODELS["base.en"]
        transcriber = WhisperTranscriber(model_spec=spec, load_delay_sim=0.05)
        elapsed = transcriber.load_model()

        assert transcriber.is_loaded is True
        assert elapsed < 10.0
        assert elapsed == transcriber.last_load_time

    def test_load_time_exceeding_10s_raises_error(self):
        spec = WHISPER_MODELS["base.en"]
        transcriber = WhisperTranscriber(model_spec=spec, load_delay_sim=0.0)
        # Mock time.perf_counter to simulate elapsed 10.5 seconds
        with patch("time.perf_counter", side_effect=[0.0, 10.5]):
            with pytest.raises(LoadTimeExceededError, match="exceeded limit of 10.0s"):
                transcriber.load_model()


class TestWERReceiptFixtures:
    """Verify Word Error Rate (WER) reduction on 10 low-light receipt fixtures.

    Acceptance criterion: on 10 low-light fixtures, base.en reduces WER by >= 30% vs tiny.en.
    """

    def test_fixture_count_is_ten(self, fixtures_data: list[dict]):
        assert len(fixtures_data) == 10

    def test_compute_wer_exact_match(self):
        ref = "two eggs over easy with hash browns"
        hyp = "two eggs over easy with hash browns"
        assert compute_wer(ref, hyp) == 0.0

    def test_compute_wer_substitutions(self):
        ref = "craft ipa pint nachos"
        hyp = "craft i p a pine nachos"
        wer = compute_wer(ref, hyp)
        assert wer > 0.0

    def test_base_en_reduces_wer_by_at_least_30_percent_on_10_fixtures(
        self, fixtures_data: list[dict]
    ):
        result = evaluate_fixtures(fixtures_data)

        count = result["count"]
        avg_tiny_wer = result["avg_tiny_wer"]
        avg_base_wer = result["avg_base_wer"]
        rel_reduction = result["relative_wer_reduction"]

        assert count == 10
        assert avg_tiny_wer > 0.0
        assert avg_base_wer < avg_tiny_wer

        # Acceptance requirement: reduces WER by >= 30% vs tiny.en
        reduction_percentage = rel_reduction * 100.0
        assert (
            rel_reduction >= 0.30
        ), f"Expected >= 30.0% reduction, achieved {reduction_percentage:.2f}%"
        assert result["meets_30_percent_reduction"] is True

        # Verify improvement on each fixture
        for fixture_result in result["fixtures"]:
            assert fixture_result["base_wer"] <= fixture_result["tiny_wer"]
