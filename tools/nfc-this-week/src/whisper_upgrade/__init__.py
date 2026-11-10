"""Whisper upgrade module package."""

from src.whisper_upgrade.downloader import (
    ChecksumMismatchError,
    DownloadError,
    ModelDownloader,
)
from src.whisper_upgrade.metrics import compute_wer, evaluate_fixtures
from src.whisper_upgrade.models import WHISPER_MODELS, WhisperModelSpec
from src.whisper_upgrade.options import OptionsError, WhisperOptions
from src.whisper_upgrade.transcriber import LoadTimeExceededError, WhisperTranscriber

__all__ = [
    "WHISPER_MODELS",
    "ChecksumMismatchError",
    "DownloadError",
    "LoadTimeExceededError",
    "ModelDownloader",
    "OptionsError",
    "WhisperModelSpec",
    "WhisperOptions",
    "WhisperTranscriber",
    "compute_wer",
    "evaluate_fixtures",
]
