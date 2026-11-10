"""Factory function for retrieving publisher instances."""

from typing import Callable, Optional
from src.publisher.base import BasePublisher, PublisherError
from src.publisher.npm import NpmPublisher
from src.publisher.pypi import PyPiPublisher


def get_publisher(package_type: str, runner: Optional[Callable] = None) -> BasePublisher:
    """Retrieve appropriate publisher instance based on package type.

    Args:
        package_type: The package ecosystem type ('npm', 'pypi', 'python').
        runner: Optional custom runner for subprocess execution.

    Returns:
        An instance of BasePublisher for the target ecosystem.

    Raises:
        PublisherError: If package_type is unsupported.
    """
    normalized_type = package_type.lower().strip()
    if normalized_type == "npm":
        return NpmPublisher(runner=runner)
    elif normalized_type in ("pypi", "python"):
        return PyPiPublisher(runner=runner)
    else:
        raise PublisherError(f"Unsupported package type: '{package_type}'. Supported types: 'npm', 'pypi'.")
