"""Command-line interface for extractacts."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from extractacts.prompts import (
    DEFAULT_PROMPTS_DIR,
    PromptManager,
    PromptTemplateError,
)


def get_prompts_dir() -> Path:
    """Returns the prompts directory, respecting EXTRACTACTS_PROMPTS_DIR if configured."""
    custom_dir = os.environ.get("EXTRACTACTS_PROMPTS_DIR")
    if custom_dir:
        return Path(custom_dir)
    return DEFAULT_PROMPTS_DIR


def build_parser() -> argparse.ArgumentParser:
    """Builds the argument parser for the CLI."""
    parser = argparse.ArgumentParser(
        prog="extractacts",
        description="Turn meeting transcripts into checkable task lists without leaving terminal.",
    )
    parser.add_argument(
        "--prompt",
        "-p",
        default="default",
        help="Prompt template name to use (built-in or from ~/.extractacts/prompts/)",
    )
    parser.add_argument(
        "--list-prompts",
        action="store_true",
        help="List all available prompt templates (built-in and custom)",
    )
    parser.add_argument(
        "--file",
        "-f",
        type=Path,
        help="Path to meeting transcript file. If omitted, reads from stdin.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """CLI entry point for extractacts."""
    parser = build_parser()
    args = parser.parse_args(argv)

    prompts_dir = get_prompts_dir()
    manager = PromptManager(user_prompts_dir=prompts_dir)

    if args.list_prompts:
        templates = manager.list_templates()
        print("Available prompt templates:")
        for name in templates:
            _, is_custom = manager.get_template_source(name)
            kind = "custom" if is_custom else "builtin"
            print(f"  - {name} ({kind})")
        return 0

    if args.file:
        try:
            transcript = args.file.read_text(encoding="utf-8")
        except OSError as err:
            sys.stderr.write(f"Error reading transcript file '{args.file}': {err}\n")
            return 1
    else:
        if sys.stdin.isatty():
            parser.print_help(sys.stderr)
            return 1
        transcript = sys.stdin.read()

    try:
        rendered = manager.render(args.prompt, transcript=transcript)
        print(rendered)
        return 0
    except PromptTemplateError as err:
        sys.stderr.write(f"Error: {err}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
