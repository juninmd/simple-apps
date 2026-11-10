"""Model specifications for local Whisper speech recognition."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class WhisperModelSpec:
    """Specification of a Whisper model."""

    name: str
    size_bytes: int
    size_mb: float
    is_optional_download: bool
    download_url: str
    sha256_checksum: Optional[str] = None
    description: str = ""


# Specifications for supported Whisper models in nfc-this-week
WHISPER_MODELS: dict[str, WhisperModelSpec] = {
    "tiny.en": WhisperModelSpec(
        name="tiny.en",
        size_bytes=77691717,
        size_mb=74.1,
        is_optional_download=False,
        download_url="https://openaipublic.azureedge.net/main/whisper/models/d3dd57d32accea0b3a8084c88e59d8c92396354f64c4d27da12984e937cb3d1f/tiny.en.pt",
        sha256_checksum="d3dd57d32accea0b3a8084c88e59d8c92396354f64c4d27da12984e937cb3d1f",
        description="Default lightweight Whisper model (~75MB) bundled for fast transcription.",
    ),
    "base.en": WhisperModelSpec(
        name="base.en",
        size_bytes=148524457,
        size_mb=141.6,
        is_optional_download=True,
        download_url="https://openaipublic.azureedge.net/main/whisper/models/a345f343a8e38f5180c675e97b940957941614f46014730ed767179b9d518494/base.en.pt",
        sha256_checksum="a345f343a8e38f5180c675e97b940957941614f46014730ed767179b9d518494",
        description="Upgraded Whisper base model (~142MB) for higher accuracy on noisy receipts.",
    ),
}
