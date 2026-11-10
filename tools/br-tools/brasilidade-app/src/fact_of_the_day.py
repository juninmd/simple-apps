#!/usr/bin/env python3
"""
Fact of the Day module for brasilidade-app.
Selects and formats a daily fact about Brazilian culture, history, and trivia.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_FACTS_PATH = Path(__file__).resolve().parent.parent / "data" / "facts.json"


def load_facts(facts_file=DEFAULT_FACTS_PATH):
    """Loads facts list from a JSON file."""
    with open(facts_file, "r", encoding="utf-8") as f:
        facts = json.load(f)
    if not facts:
        raise ValueError("Facts list cannot be empty.")
    return facts


def get_daily_fact(facts, target_date=None):
    """
    Selects a fact deterministically based on the given target_date (datetime.date).
    If target_date is None, uses today's date in UTC.
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()
    index = target_date.toordinal() % len(facts)
    return facts[index]


def format_fact_markdown(fact, date_str=None):
    """Formats a fact dictionary into a Markdown notification string."""
    if date_str is None:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    markdown = (
        f"### 🇧🇷 Fact of the Day - {date_str}\n\n"
        f"**{fact.get('title', 'Brazilian Trivia')}**\n\n"
        f"*{fact.get('topic', 'General')}*\n\n"
        f"{fact.get('fact', '')}\n"
    )
    return markdown


def main():
    parser = argparse.ArgumentParser(description="Get Daily Fact of the Day")
    parser.add_argument(
        "--facts-file",
        type=Path,
        default=DEFAULT_FACTS_PATH,
        help="Path to facts JSON file",
    )
    parser.add_argument(
        "--date",
        type=str,
        help="Target date in YYYY-MM-DD format (defaults to UTC today)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output in JSON format instead of Markdown",
    )

    args = parser.parse_args()

    facts = load_facts(args.facts_file)

    if args.date:
        target_date = datetime.strptime(args.date, "%Y-%m-%d").date()
    else:
        target_date = datetime.now(timezone.utc).date()

    fact = get_daily_fact(facts, target_date)

    if args.json:
        output = json.dumps({"date": target_date.isoformat(), "fact": fact}, indent=2, ensure_ascii=False)
    else:
        output = format_fact_markdown(fact, date_str=target_date.isoformat())

    print(output)

    # If running inside GitHub Actions, append output to Step Summary
    github_summary = os.getenv("GITHUB_STEP_SUMMARY")
    if github_summary and not args.json:
        with open(github_summary, "a", encoding="utf-8") as f:
            f.write(output + "\n")


if __name__ == "__main__":
    main()
