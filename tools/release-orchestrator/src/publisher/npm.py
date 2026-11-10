"""NPM package publisher implementation."""

import os
from typing import Any, List, Optional
from src.publisher.base import BasePublisher, PublisherError, PublishResult


class NpmPublisher(BasePublisher):
    """Publisher for NPM packages using the `npm` CLI tool."""

    def publish(
        self,
        dist_path: str,
        registry: Optional[str] = None,
        tag: Optional[str] = None,
        access: Optional[str] = None,
        token: Optional[str] = None,
        dry_run: bool = False,
        extra_args: Optional[List[str]] = None,
        **options: Any,
    ) -> PublishResult:
        """Publish an NPM package artifact.

        Args:
            dist_path: Path to the npm package directory or tarball (.tgz).
            registry: Custom NPM registry URL.
            tag: NPM tag to publish (e.g. 'latest', 'beta').
            access: Package access level ('public' or 'restricted').
            token: NPM authentication token.
            dry_run: If True, executes npm publish with --dry-run.
            extra_args: Additional command line arguments for npm publish.

        Returns:
            PublishResult describing success or failure.

        Raises:
            PublisherError: If package publishing fails.
        """
        cmd = ["npm", "publish"]
        if dist_path:
            cmd.append(dist_path)

        if registry:
            cmd.extend(["--registry", registry])

        if tag:
            cmd.extend(["--tag", tag])

        if access:
            cmd.extend(["--access", access])

        if dry_run:
            cmd.append("--dry-run")

        if extra_args:
            cmd.extend(extra_args)

        env = os.environ.copy()
        secrets = []
        if token:
            env["NODE_AUTH_TOKEN"] = token
            env["NPM_TOKEN"] = token
            secrets.append(token)

        res = self._runner(cmd, env=env)

        stdout = self.mask_secrets(res.stdout, secrets)
        stderr = self.mask_secrets(res.stderr, secrets)

        if res.returncode != 0:
            err_msg = f"NPM publish failed with exit code {res.returncode}:\n{stderr}"
            raise PublisherError(err_msg)

        return PublishResult(
            success=True,
            package_type="npm",
            dist_path=dist_path,
            stdout=stdout,
            stderr=stderr,
            details={
                "registry": registry,
                "tag": tag,
                "access": access,
                "dry_run": dry_run,
            },
        )
