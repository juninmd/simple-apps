"""Unit tests for NPM publisher module."""

import subprocess
from unittest.mock import MagicMock
import pytest
from src.publisher.base import PublisherError
from src.publisher.npm import NpmPublisher


def test_npm_publish_success():
    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=0, stdout="+ my-pkg@1.0.0", stderr=""
    )

    publisher = NpmPublisher(runner=mock_runner)
    res = publisher.publish("./my-pkg")

    assert res.success is True
    assert res.package_type == "npm"
    assert "+ my-pkg@1.0.0" in res.stdout

    mock_runner.assert_called_once()
    cmd = mock_runner.call_args[0][0]
    assert cmd == ["npm", "publish", "./my-pkg"]


def test_npm_publish_options():
    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=0, stdout="published", stderr=""
    )

    publisher = NpmPublisher(runner=mock_runner)
    publisher.publish(
        "./my-pkg",
        registry="https://registry.npmjs.org",
        tag="beta",
        access="public",
        dry_run=True,
    )

    cmd = mock_runner.call_args[0][0]
    assert "--registry" in cmd
    assert "https://registry.npmjs.org" in cmd
    assert "--tag" in cmd
    assert "beta" in cmd
    assert "--access" in cmd
    assert "public" in cmd
    assert "--dry-run" in cmd


def test_npm_publish_token_masking():
    token = "npm_secret_token_abc"
    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=1, stdout="", stderr=f"Auth error with token {token}"
    )

    publisher = NpmPublisher(runner=mock_runner)
    with pytest.raises(PublisherError) as exc_info:
        publisher.publish("./my-pkg", token=token)

    err_msg = str(exc_info.value)
    assert token not in err_msg
    assert "***SCRUBBED***" in err_msg

    env = mock_runner.call_args[1]["env"]
    assert env["NODE_AUTH_TOKEN"] == token
    assert env["NPM_TOKEN"] == token
