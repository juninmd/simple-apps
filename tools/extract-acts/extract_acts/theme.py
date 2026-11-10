"""Terminal color scheme detection and theme management for Textual."""

from __future__ import annotations

import os
import shutil
import subprocess
from typing import Literal

ThemeMode = Literal["dark", "light"]

# Default Textual themes for each mode
THEME_MAPPINGS: dict[str, str] = {
    "dark": "textual-dark",
    "light": "textual-light",
}


def _check_colorfgbg(value: str) -> ThemeMode | None:
    """Parse the COLORFGBG environment variable.

    COLORFGBG typically has the format "fg;bg" or "fg;extra;bg".
    ANSI color codes:
      0-6, 8: dark background colors (black, red, green, yellow, blue, magenta, cyan)
      7, 11-15: light background colors (white, bright colors)
    """
    if not value:
        return None
    parts = value.strip().split(";")
    if len(parts) >= 2:
        try:
            bg = int(parts[-1])
            # Colors 7 (white) and 11-15 (bright yellow, bright white, etc.) represent light backgrounds
            if bg in (7, 11, 12, 13, 14, 15):
                return "light"
            return "dark"
        except ValueError:
            pass
    return None


def _check_macos_interface_style() -> ThemeMode | None:
    """Check macOS system theme via defaults read command if available."""
    if shutil.which("defaults") is None:
        return None
    try:
        proc = subprocess.run(
            ["defaults", "read", "-g", "AppleInterfaceStyle"],
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if proc.returncode == 0 and "Dark" in proc.stdout:
            return "dark"
        # On macOS, if AppleInterfaceStyle is not set, the theme is Light
        if proc.returncode != 0 and "does not exist" in proc.stderr:
            return "light"
    except (subprocess.SubprocessError, OSError):
        return None
    return None


def detect_terminal_theme(
    default: ThemeMode = "dark",
    env: dict[str, str] | None = None,
) -> ThemeMode:
    """Detect terminal color scheme ('dark' or 'light').

    Checks in priority order:
    1. TEXTUAL_THEME or EXTRACT_ACTS_THEME environment variables
    2. TERM_BACKGROUND environment variable
    3. COLORFGBG environment variable
    4. macOS system interface style (if running on macOS)
    5. Fallback default ('dark')
    """
    environ = os.environ if env is None else env

    # 1. Explicit theme / mode overrides
    explicit = environ.get("EXTRACT_ACTS_THEME") or environ.get("TEXTUAL_THEME")
    if explicit:
        explicit_clean = explicit.strip().lower()
        if "light" in explicit_clean:
            return "light"
        if "dark" in explicit_clean:
            return "dark"

    # 2. TERM_BACKGROUND (set by some terminal emulators, e.g. 'light' or 'dark')
    term_bg = environ.get("TERM_BACKGROUND")
    if term_bg:
        term_bg_clean = term_bg.strip().lower()
        if term_bg_clean in ("light", "dark"):
            return term_bg_clean  # type: ignore[return-value]

    # 3. COLORFGBG
    colorfgbg = environ.get("COLORFGBG")
    if colorfgbg:
        detected = _check_colorfgbg(colorfgbg)
        if detected is not None:
            return detected

    # 4. macOS AppleInterfaceStyle check
    macos_mode = _check_macos_interface_style()
    if macos_mode is not None:
        return macos_mode

    # 5. Default
    return default


def get_theme_for_mode(
    mode: str | None = None,
    env: dict[str, str] | None = None,
) -> str:
    """Get the appropriate Textual theme name for the given mode or auto-detect it.

    Parameters
    ----------
    mode: 'auto', 'dark', 'light', or a specific Textual theme name.
    env: Optional environment dictionary for testing detection.

    Returns
    -------
    Textual theme name, e.g. 'textual-dark' or 'textual-light'.
    """
    if not mode or mode == "auto":
        detected_mode = detect_terminal_theme(env=env)
        return THEME_MAPPINGS[detected_mode]

    mode_lower = mode.strip().lower()
    if mode_lower in THEME_MAPPINGS:
        return THEME_MAPPINGS[mode_lower]

    # If the user supplied a specific Textual theme name (e.g. 'nord', 'solarized-light')
    return mode.strip()
