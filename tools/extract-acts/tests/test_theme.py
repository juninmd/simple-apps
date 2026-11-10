"""Unit tests for theme detection and mapping."""

from __future__ import annotations

import pytest

from extract_acts.theme import (
    _check_colorfgbg,
    detect_terminal_theme,
    get_theme_for_mode,
)


@pytest.mark.parametrize(
    ("val", "expected"),
    [
        ("15;0", "dark"),
        ("0;15", "light"),
        ("15;7", "light"),
        ("0;11", "light"),
        ("0;12", "light"),
        ("0;13", "light"),
        ("0;14", "light"),
        ("7;0", "dark"),
        ("15;default;0", "dark"),
        ("0;default;15", "light"),
        ("invalid", None),
        ("", None),
        ("not_a_number;not_a_number", None),
    ],
)
def test_check_colorfgbg(val: str, expected: str | None) -> None:
    assert _check_colorfgbg(val) == expected


def test_detect_terminal_theme_explicit_override() -> None:
    env_light = {"TEXTUAL_THEME": "textual-light"}
    assert detect_terminal_theme(env=env_light) == "light"

    env_dark = {"EXTRACT_ACTS_THEME": "dark"}
    assert detect_terminal_theme(env=env_dark) == "dark"


def test_detect_terminal_theme_term_background() -> None:
    env_light = {"TERM_BACKGROUND": "light"}
    assert detect_terminal_theme(env=env_light) == "light"

    env_dark = {"TERM_BACKGROUND": "dark"}
    assert detect_terminal_theme(env=env_dark) == "dark"


def test_detect_terminal_theme_colorfgbg() -> None:
    env_light = {"COLORFGBG": "0;15"}
    assert detect_terminal_theme(env=env_light) == "light"

    env_dark = {"COLORFGBG": "15;0"}
    assert detect_terminal_theme(env=env_dark) == "dark"


def test_detect_terminal_theme_fallback_default() -> None:
    assert detect_terminal_theme(env={}, default="dark") == "dark"
    assert detect_terminal_theme(env={}, default="light") == "light"


def test_get_theme_for_mode() -> None:
    assert get_theme_for_mode("dark") == "textual-dark"
    assert get_theme_for_mode("light") == "textual-light"
    assert get_theme_for_mode("auto", env={"COLORFGBG": "0;15"}) == "textual-light"
    assert get_theme_for_mode("auto", env={"COLORFGBG": "15;0"}) == "textual-dark"
    assert get_theme_for_mode("nord") == "nord"
    assert get_theme_for_mode("solarized-light") == "solarized-light"
