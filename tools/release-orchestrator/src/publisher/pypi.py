"""PyPI package publisher implementation via Twine."""

import glob
import os
import sys
from typing import Any, List, Optional
from src.publisher.base import BasePublisher, PublisherError, PublishResult


class PyPiPublisher(BasePublisher):
    """Publisher for Python packages using Twine (`twine upload`)."""

    def publish(
        self,
        dist_path: str,
        repository_url: Optional[str] = None,
        repository: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        token: Optional[str] = None,
        config_file: Optional[str] = None,
        skip_existing: bool = False,
        dry_run: bool = False,
        check_first: bool = True,
        extra_args: Optional[List[str]] = None,
        **options: Any,
    ) -> PublishResult:
        """Publish Python package distribution files to PyPI or compatible index.

        Args:
            dist_path: Path or pattern to distribution files (e.g. 'dist/*', 'dist/pkg.whl', 'dist/').
            repository_url: Target PyPI repository URL (e.g. 'https://upload.pypi.org/legacy/').
            repository: Named repository section from .pypirc config file.
            username: Username for repository authentication.
            password: Password for repository authentication.
            token: PyPI API token (sets username to '__token__').
            config_file: Path to custom .pypirc file.
            skip_existing: If True, passes --skip-existing to twine.
            dry_run: If True, executes twine check and simulates upload without publishing.
            check_first: If True, executes `twine check` before uploading.
            extra_args: Additional CLI options for twine upload.

        Returns:
            PublishResult describing operation output.

        Raises:
            PublisherError: If artifact finding, twine check, or twine upload fails.
        """
        artifacts = self._resolve_artifacts(dist_path)
        if not artifacts:
            raise PublisherError(f"No distribution artifacts found matching path/pattern: {dist_path}")

        secrets: List[str] = []

        env = os.environ.copy()

        if token:
            env["TWINE_USERNAME"] = "__token__"
            env["TWINE_PASSWORD"] = token
            secrets.append(token)
        else:
            if username:
                env["TWINE_USERNAME"] = username
            if password:
                env["TWINE_PASSWORD"] = password
                secrets.append(password)

        if check_first or dry_run:
            check_cmd = [sys.executable, "-m", "twine", "check"] + artifacts
            check_res = self._runner(check_cmd, env=env)
            check_out = self.mask_secrets(check_res.stdout, secrets)
            check_err = self.mask_secrets(check_res.stderr, secrets)

            if check_res.returncode != 0:
                raise PublisherError(f"Twine package check failed:\n{check_err or check_out}")

            if dry_run:
                return PublishResult(
                    success=True,
                    package_type="pypi",
                    dist_path=dist_path,
                    stdout=check_out,
                    stderr=check_err,
                    details={
                        "dry_run": True,
                        "artifacts": artifacts,
                        "check_passed": True,
                    },
                )

        cmd = [sys.executable, "-m", "twine", "upload", "--non-interactive"]

        if repository_url:
            cmd.extend(["--repository-url", repository_url])

        if repository:
            cmd.extend(["--repository", repository])

        if config_file:
            cmd.extend(["--config-file", config_file])

        if skip_existing:
            cmd.append("--skip-existing")

        if extra_args:
            cmd.extend(extra_args)

        cmd.extend(artifacts)

        res = self._runner(cmd, env=env)

        stdout = self.mask_secrets(res.stdout, secrets)
        stderr = self.mask_secrets(res.stderr, secrets)

        if res.returncode != 0:
            raise PublisherError(f"PyPI upload via twine failed with exit code {res.returncode}:\n{stderr}")

        return PublishResult(
            success=True,
            package_type="pypi",
            dist_path=dist_path,
            stdout=stdout,
            stderr=stderr,
            details={
                "repository_url": repository_url,
                "repository": repository,
                "artifacts": artifacts,
                "skip_existing": skip_existing,
            },
        )

    @staticmethod
    def _resolve_artifacts(dist_path: str) -> List[str]:
        """Resolve dist_path into a list of file paths."""
        if os.path.isdir(dist_path):
            files = []
            for ext in ("*.whl", "*.tar.gz", "*.zip"):
                files.extend(glob.glob(os.path.join(dist_path, ext)))
            return sorted(files)

        if "*" in dist_path or "?" in dist_path:
            return sorted(glob.glob(dist_path))

        if os.path.isfile(dist_path):
            return [dist_path]

        return []
