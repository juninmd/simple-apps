"""Command-line interface for br-feriado-checker."""

import argparse
import datetime
import sys
from typing import List, Optional

from br_feriado_checker.holidays import get_holidays, is_holiday
from br_feriado_checker.ical import generate_ics


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="br-feriado-checker",
        description="Check Brazilian holidays and generate iCal/ICS feeds for calendar subscriptions."
    )
    parser.add_argument(
        "--date",
        type=str,
        help="Date to check in YYYY-MM-DD format (defaults to today)"
    )
    parser.add_argument(
        "--year",
        type=int,
        default=datetime.date.today().year,
        help="Year to query or generate calendar for (defaults to current year)"
    )
    parser.add_argument(
        "--state",
        type=str,
        help="Two-letter state code (e.g. SP, RJ, MG)"
    )
    parser.add_argument(
        "--city",
        type=str,
        help="City name (e.g. 'sao paulo', 'rio de janeiro')"
    )
    parser.add_argument(
        "--ical",
        action="store_true",
        help="Generate iCal/ICS format output"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        help="Path to save output file (e.g. feriados.ics)"
    )
    parser.add_argument(
        "--calname",
        type=str,
        default="Feriados do Brasil",
        help="Name of the calendar for iCal/ICS output"
    )
    return parser


def main(args: Optional[List[str]] = None) -> int:
    parser = build_parser()
    parsed_args = parser.parse_args(args)

    year = parsed_args.year
    state = parsed_args.state
    city = parsed_args.city

    if parsed_args.ical or parsed_args.output:
        holidays = get_holidays(year, state=state, city=city)
        ics_content = generate_ics(holidays, calendar_name=parsed_args.calname)

        if parsed_args.output:
            with open(parsed_args.output, "w", encoding="utf-8", newline="") as f:
                f.write(ics_content)
            print(f"Calendar saved to {parsed_args.output}")
        else:
            sys.stdout.write(ics_content)
        return 0

    # Normal CLI mode: check specific date or today
    if parsed_args.date:
        try:
            check_date = datetime.date.fromisoformat(parsed_args.date)
        except ValueError:
            print(f"Invalid date format: {parsed_args.date}. Use YYYY-MM-DD.", file=sys.stderr)
            return 1
    else:
        check_date = datetime.date.today()

    holiday = is_holiday(check_date, state=state, city=city)
    date_str = check_date.strftime("%d/%m/%Y")

    if holiday:
        print(f"🎉 {date_str} é feriado! [{holiday.type}] {holiday.name}")
    else:
        print(f"🏢 {date_str} não é feriado. Dia útil de trabalho.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
