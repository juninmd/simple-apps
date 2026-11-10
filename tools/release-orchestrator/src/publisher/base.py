"""Base interfaces and models for package publishers."""

import subprocess
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


class PublisherError(Exception):
    """Exception raised when package publishing fails."""

    pass


@dataclass
class PublishResult:
    """Represents the outcome of a package publication operation."""

    success: bool
    package_type: str
    dist_path: str
    stdout: str = ""
    stderr: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


class BasePublisher(ABC):
    """Abstract base class for all package publishers."""

    def __init__(self, runner: Optional[Callable[..., subprocess.CompletedProcess]] = None) -> None:
        """Initialize publisher with an optional custom command runner."""
        self._runner = runner or self._default_runner

    @staticmethod
    def _default_runner(cmd: List[str], env: Optional[Dict[str, str]] = None, cwd: Optional[str] = None) -> subprocess.CompletedProcess:
        """Default runner executing shell commands using subprocess.run."""
        return subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            cwd=cwd,
            check=False,
        )

    @staticmethod
    def mask_secrets(text: str, secrets: List[str]) -> str:
        """Mask sensitive values in strings to prevent log leakage."""
        masked_text = text
        for secret in secrets:
            if secret and len(secret) > 0:
                masked_text = masked_text.replace(secret, "***SCRUBBED***")
        return masked_text

    @abstractmethod
    def publish(self, dist_path: str, **options: Any) -> PublishResult:
        """Publish a package artifact located at dist_path."""
        pass
