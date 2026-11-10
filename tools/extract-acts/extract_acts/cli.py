"""Command-line interface for extract-acts."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from extract_acts.app import DEFAULT_CHECKLIST_MD, ChecklistApp
from extract_acts.theme import detect_terminal_theme


def create_parser() -> argparse.ArgumentParser:
    """Create command-line argument parser."""
    parser = argparse.ArgumentParser(
        prog="extract-acts",
        description="Turn meeting transcripts into checkable task lists without leaving the terminal.",
    )
    parser.add_argument(
        "-f",
        "--file",
        type=Path,
        help="Path to markdown file or meeting transcript to render as a checklist.",
    )
    parser.add_argument(
        "-m",
        "--mode",
        choices=["auto", "dark", "light"],
        default="auto",
        help="Color scheme mode: 'auto' (detect terminal color scheme), 'dark', or 'light' (default: auto).",
    )
    parser.add_argument(
        "--theme",
        type=str,
        default=None,
        help="Explicit Textual theme name to apply (e.g. 'textual-dark', 'textual-light', 'nord', 'solarized-light').",
    )
    parser.add_argument(
        "--detect-theme",
        action="store_true",
        help="Print the detected terminal color scheme ('dark' or 'light') and exit.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """CLI entry point."""
    parser = create_parser()
    args = parser.parse_args(argv)

    if args.detect_theme:
        print(detect_terminal_theme())
        return 0

    content = DEFAULT_CHECKLIST_MD
    if args.file:
        if not args.file.exists():
            print(f"Error: file not found: {args.file}", file=sys.stderr)
            return 2
        try:
            content = args.file.read_text(encoding="utf-8")
        except OSError as err:
            print(f"Error reading file {args.file}: {err}", file=sys.stderr)
            return 1

    selected_mode = args.theme if args.theme else args.mode

    app = ChecklistApp(markdown_content=content, mode=selected_mode)
    app.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
