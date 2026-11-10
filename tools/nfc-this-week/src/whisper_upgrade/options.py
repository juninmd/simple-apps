"""User options and configuration manager for Whisper model selection."""

import json
from pathlib import Path
from typing import Any, Optional

from src.whisper_upgrade.downloader import ModelDownloader
from src.whisper_upgrade.models import WHISPER_MODELS, WhisperModelSpec


class OptionsError(Exception):
    """Raised on invalid options state."""


class WhisperOptions:
    """Manages user preferences for Whisper models (default tiny.en vs base.en toggle)."""

    def __init__(
        self,
        config_path: Optional[Path] = None,
        downloader: Optional[ModelDownloader] = None,
    ):
        self.config_path = config_path or Path.home() / ".config" / "nfc_this_week" / "options.json"
        self.downloader = downloader or ModelDownloader()
        self._config: dict[str, Any] = {
            "selected_model": "tiny.en",
            "base_en_downloaded": False,
        }
        self.load()

    def load(self) -> None:
        """Load options from file if present."""
        if self.config_path.exists():
            try:
                with open(self.config_path, encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self._config.update(data)
            except Exception:
                pass  # Fall back to defaults safely

    def save(self) -> None:
        """Persist current options to disk."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self._config, f, indent=2)

    @property
    def selected_model_name(self) -> str:
        """Currently active model name."""
        return self._config.get("selected_model", "tiny.en")

    def get_selected_model_spec(self) -> WhisperModelSpec:
        """Get spec of selected model."""
        name = self.selected_model_name
        return WHISPER_MODELS.get(name, WHISPER_MODELS["tiny.en"])

    def is_base_en_available(self) -> bool:
        """Check if base.en is downloaded and ready to use."""
        spec = WHISPER_MODELS["base.en"]
        return self.downloader.is_downloaded(spec)

    def toggle_model(self, use_base_en: bool) -> str:
        """Toggle between tiny.en and base.en.

        If base.en is requested but not downloaded, raises OptionsError.
        """
        if use_base_en:
            if not self.is_base_en_available():
                raise OptionsError(
                    "Cannot select 'base.en': model is not downloaded. "
                    "Please download 'base.en' (~142MB) first."
                )
            self._config["selected_model"] = "base.en"
        else:
            self._config["selected_model"] = "tiny.en"

        self.save()
        return self.selected_model_name

    def download_base_en(self, progress_callback: Any = None) -> Path:
        """Download optional base.en model."""
        spec = WHISPER_MODELS["base.en"]
        path = self.downloader.download(spec, progress_callback=progress_callback)
        self._config["base_en_downloaded"] = True
        self.save()
        return path

    def remove_base_en(self) -> bool:
        """Delete base.en model and reset active selection if necessary."""
        spec = WHISPER_MODELS["base.en"]
        deleted = self.downloader.delete(spec)
        self._config["base_en_downloaded"] = False
        if self.selected_model_name == "base.en":
            self._config["selected_model"] = "tiny.en"
        self.save()
        return deleted
