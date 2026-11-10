"""Resilient and secure model downloader for Whisper models."""

import hashlib
import os
import tempfile
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Optional

from src.whisper_upgrade.models import WhisperModelSpec


class DownloadError(Exception):
    """Raised when downloading a model fails."""


class ChecksumMismatchError(DownloadError):
    """Raised when the downloaded file checksum does not match expected hash."""


class ModelDownloader:
    """Handles downloading Whisper models with integrity checking and timeout control."""

    def __init__(self, cache_dir: Optional[Path] = None, timeout_seconds: float = 30.0):
        self.cache_dir = cache_dir or Path.home() / ".cache" / "whisper_models"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.timeout_seconds = timeout_seconds

    def get_model_path(self, model_spec: WhisperModelSpec) -> Path:
        """Get destination path for a given model spec."""
        return self.cache_dir / f"{model_spec.name}.pt"

    def is_downloaded(self, model_spec: WhisperModelSpec) -> bool:
        """Check if model exists in cache and has non-zero size."""
        path = self.get_model_path(model_spec)
        return path.exists() and path.stat().st_size > 0

    def download(
        self,
        model_spec: WhisperModelSpec,
        progress_callback: Optional[Callable[[int, int], None]] = None,
        force: bool = False,
    ) -> Path:
        """Download model to cache directory with SHA256 integrity verification."""
        target_path = self.get_model_path(model_spec)
        if self.is_downloaded(model_spec) and not force:
            return target_path

        temp_fd, temp_path_str = tempfile.mkstemp(
            dir=str(self.cache_dir), prefix=f"{model_spec.name}_tmp_"
        )
        temp_path = Path(temp_path_str)
        hasher = hashlib.sha256()
        bytes_downloaded = 0

        try:
            req = urllib.request.Request(
                model_spec.download_url, headers={"User-Agent": "nfc-this-week-whisper/1.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as response:
                total_size = int(response.headers.get("Content-Length", model_spec.size_bytes))
                with os.fdopen(temp_fd, "wb") as f_out:
                    chunk_size = 64 * 1024
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        hasher.update(chunk)
                        bytes_downloaded += len(chunk)
                        if progress_callback:
                            progress_callback(bytes_downloaded, total_size)

            computed_hash = hasher.hexdigest()
            if model_spec.sha256_checksum and computed_hash != model_spec.sha256_checksum:
                raise ChecksumMismatchError(
                    f"Checksum mismatch for {model_spec.name}: "
                    f"expected {model_spec.sha256_checksum}, got {computed_hash}"
                )

            # Atomic rename into final location
            temp_path.replace(target_path)
            return target_path

        except Exception as exc:
            if temp_path.exists():
                temp_path.unlink()
            if isinstance(exc, DownloadError):
                raise
            raise DownloadError(f"Failed to download {model_spec.name}: {exc}") from exc

    def delete(self, model_spec: WhisperModelSpec) -> bool:
        """Delete model from cache to reclaim space."""
        target_path = self.get_model_path(model_spec)
        if target_path.exists():
            target_path.unlink()
            return True
        return False
