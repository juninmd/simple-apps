"""Unit tests for PyPI publisher module."""

import os
import subprocess
from unittest.mock import MagicMock
import pytest
from src.publisher.base import PublisherError
from src.publisher.pypi import PyPiPublisher


def test_resolve_artifacts_single_file(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0-py3-none-any.whl"
    pkg_file.write_text("dummy wheel content")

    artifacts = PyPiPublisher._resolve_artifacts(str(pkg_file))
    assert artifacts == [str(pkg_file)]


def test_resolve_artifacts_directory(tmp_path):
    whl_file = tmp_path / "mypkg-1.0.0-py3-none-any.whl"
    whl_file.write_text("wheel")
    sdist_file = tmp_path / "mypkg-1.0.0.tar.gz"
    sdist_file.write_text("sdist")
    txt_file = tmp_path / "README.txt"
    txt_file.write_text("readme")

    artifacts = PyPiPublisher._resolve_artifacts(str(tmp_path))
    assert len(artifacts) == 2
    assert str(whl_file) in artifacts
    assert str(sdist_file) in artifacts
    assert str(txt_file) not in artifacts


def test_resolve_artifacts_glob(tmp_path):
    whl_file = tmp_path / "mypkg-1.0.0-py3-none-any.whl"
    whl_file.write_text("wheel")

    pattern = os.path.join(str(tmp_path), "*.whl")
    artifacts = PyPiPublisher._resolve_artifacts(pattern)
    assert artifacts == [str(whl_file)]


def test_no_artifacts_found_raises_error():
    publisher = PyPiPublisher()
    with pytest.raises(PublisherError, match="No distribution artifacts found"):
        publisher.publish("/nonexistent/path/dist/*")


def test_pypi_publish_success_with_token(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0-py3-none-any.whl"
    pkg_file.write_text("dummy")

    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[],
        returncode=0,
        stdout="Uploaded mypkg-1.0.0-py3-none-any.whl",
        stderr="",
    )

    publisher = PyPiPublisher(runner=mock_runner)
    res = publisher.publish(str(pkg_file), token="pypi-secret-token-12345", check_first=False)

    assert res.success is True
    assert res.package_type == "pypi"
    assert "mypkg" in res.stdout

    mock_runner.assert_called_once()
    call_args, call_kwargs = mock_runner.call_args
    cmd = call_args[0]
    env = call_kwargs["env"]

    assert "upload" in cmd
    assert "--non-interactive" in cmd
    assert str(pkg_file) in cmd
    assert env["TWINE_USERNAME"] == "__token__"
    assert env["TWINE_PASSWORD"] == "pypi-secret-token-12345"


def test_pypi_publish_username_password(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0.tar.gz"
    pkg_file.write_text("dummy sdist")

    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=0, stdout="Upload complete", stderr=""
    )

    publisher = PyPiPublisher(runner=mock_runner)
    publisher.publish(str(pkg_file), username="myuser", password="mypassword", check_first=False)

    call_args, call_kwargs = mock_runner.call_args
    env = call_kwargs["env"]
    assert env["TWINE_USERNAME"] == "myuser"
    assert env["TWINE_PASSWORD"] == "mypassword"


def test_pypi_publish_custom_repository_url_and_options(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0.tar.gz"
    pkg_file.write_text("dummy")

    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=0, stdout="Upload complete", stderr=""
    )

    publisher = PyPiPublisher(runner=mock_runner)
    publisher.publish(
        str(pkg_file),
        repository_url="https://test.pypi.org/legacy/",
        config_file="/path/to/.pypirc",
        skip_existing=True,
        check_first=False,
    )

    cmd = mock_runner.call_args[0][0]
    assert "--repository-url" in cmd
    assert "https://test.pypi.org/legacy/" in cmd
    assert "--config-file" in cmd
    assert "/path/to/.pypirc" in cmd
    assert "--skip-existing" in cmd


def test_pypi_publish_dry_run(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0-py3-none-any.whl"
    pkg_file.write_text("dummy")

    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=0, stdout="Checking mypkg... PASSED", stderr=""
    )

    publisher = PyPiPublisher(runner=mock_runner)
    res = publisher.publish(str(pkg_file), dry_run=True)

    assert res.success is True
    assert res.details["dry_run"] is True
    assert mock_runner.call_count == 1
    cmd = mock_runner.call_args[0][0]
    assert "check" in cmd
    assert "upload" not in cmd


def test_pypi_publish_check_failure(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0.tar.gz"
    pkg_file.write_text("corrupted file")

    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=1, stdout="", stderr="Invalid package metadata"
    )

    publisher = PyPiPublisher(runner=mock_runner)
    with pytest.raises(PublisherError, match="Twine package check failed"):
        publisher.publish(str(pkg_file), dry_run=True)


def test_pypi_publish_upload_failure_and_secret_masking(tmp_path):
    pkg_file = tmp_path / "mypkg-1.0.0.tar.gz"
    pkg_file.write_text("dummy")

    secret = "super-secret-token-999"
    mock_runner = MagicMock()
    mock_runner.return_value = subprocess.CompletedProcess(
        args=[], returncode=1, stdout="", stderr=f"HTTP 401 Unauthorized for token {secret}"
    )

    publisher = PyPiPublisher(runner=mock_runner)
    with pytest.raises(PublisherError) as exc_info:
        publisher.publish(str(pkg_file), token=secret, check_first=False)

    err_str = str(exc_info.value)
    assert secret not in err_str
    assert "***SCRUBBED***" in err_str
