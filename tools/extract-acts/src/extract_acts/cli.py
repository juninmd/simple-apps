"""CLI entry point for extract-acts."""

import argparse
import sys

from extract_acts.extractor import extract_action_items


def run_cli(args: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="extract-acts",
        description="Turn meeting transcripts into checkable task lists without leaving the terminal.",
    )
    parser.add_argument(
        "file",
        nargs="?",
        type=str,
        help="Path to transcript file. If omitted or '-', reads from stdin.",
    )
    parser.add_argument(
        "--text",
        type=str,
        help="Raw transcript text directly passed as an argument.",
    )

    parsed_args = parser.parse_args(args)

    if parsed_args.text is not None:
        content = parsed_args.text
    elif parsed_args.file and parsed_args.file != "-":
        try:
            with open(parsed_args.file, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError as e:
            sys.stderr.write(f"Error reading file '{parsed_args.file}': {e}\n")
            return 1
    else:
        # Read from stdin
        if sys.stdin.isatty() and not parsed_args.file:
            parser.print_help(sys.stderr)
            return 2
        content = sys.stdin.read()

    action_items = extract_action_items(content)
    for item in action_items:
        sys.stdout.write(item.to_markdown() + "\n")

    return 0


def main() -> None:
    sys.exit(run_cli())
