"""Unit tests for publisher factory module."""

import pytest
from src.publisher.base import PublisherError
from src.publisher.factory import get_publisher
from src.publisher.npm import NpmPublisher
from src.publisher.pypi import PyPiPublisher


def test_get_publisher_npm():
    pub = get_publisher("npm")
    assert isinstance(pub, NpmPublisher)

    pub_upper = get_publisher("NPM")
    assert isinstance(pub_upper, NpmPublisher)


def test_get_publisher_pypi():
    pub_pypi = get_publisher("pypi")
    assert isinstance(pub_pypi, PyPiPublisher)

    pub_python = get_publisher("python")
    assert isinstance(pub_python, PyPiPublisher)


def test_get_publisher_unsupported():
    with pytest.raises(PublisherError, match="Unsupported package type"):
        get_publisher("rubygems")
