import argparse
import datetime
import json
import sys
from typing import List, Optional

from feriado_br.holidays import get_holidays, Holiday


def parse_args(args: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="feriado-br",
        description="List Brazil's national, state, and municipal holidays for a given year.",
    )

    current_year = datetime.date.today().year

    parser.add_argument(
        "positional_year",
        nargs="?",
        type=int,
        default=None,
        help=f"Year to list holidays for (default: current year {current_year}).",
    )

    parser.add_argument(
        "-y",
        "--year",
        type=int,
        default=None,
        help="Year to list holidays for (overrides positional year).",
    )

    parser.add_argument(
        "-s",
        "--state",
        type=str,
        default=None,
        help="Filter holidays by state UF code (e.g., SP, RJ, MG).",
    )

    parser.add_argument(
        "-c",
        "--city",
        "--municipality",
        dest="city",
        type=str,
        default=None,
        help="Filter holidays by municipality/city name (e.g., 'São Paulo', 'Rio de Janeiro').",
    )

    parser.add_argument(
        "-t",
        "--type",
        type=str,
        choices=["national", "state", "municipal", "all"],
        default=None,
        help="Filter holidays by type (national, state, municipal, all).",
    )

    parser.add_argument(
        "-j",
        "--json",
        action="store_true",
        help="Output in JSON format.",
    )

    parser.add_argument(
        "-n",
        "--next",
        action="store_true",
        help="Show only the next upcoming holiday (today included), ignoring the year.",
    )

    parsed = parser.parse_args(args)

    # Determine the target year
    if parsed.year is not None:
        parsed.target_year = parsed.year
    elif parsed.positional_year is not None:
        parsed.target_year = parsed.positional_year
    else:
        parsed.target_year = current_year

    return parsed


def next_holiday(**filters) -> List[Holiday]:
    today = datetime.date.today()
    for year in (today.year, today.year + 1):
        upcoming = [h for h in get_holidays(year=year, **filters) if h.date >= today]
        if upcoming:
            return upcoming[:1]
    return []


def main(args: Optional[List[str]] = None) -> None:
    parsed_args = parse_args(args)

    filters = {
        "state": parsed_args.state,
        "city": parsed_args.city,
        "holiday_type": parsed_args.type,
    }
    if parsed_args.next:
        holidays = next_holiday(**filters)
    else:
        holidays = get_holidays(year=parsed_args.target_year, **filters)

    if parsed_args.json:
        json_data = [h.to_dict() for h in holidays]
        print(json.dumps(json_data, ensure_ascii=False, indent=2))
    else:
        if not holidays:
            print("Nenhum feriado encontrado.")
            return

        title = "Próximo feriado" if parsed_args.next else f"Feriados para {parsed_args.target_year}"
        print(f"{title}:")
        print("-" * 50)
        for h in holidays:
            date_str = h.date.strftime("%d/%m/%Y")
            print(f"{date_str} - {h.name} [{h.type.capitalize()}] ({h.location})")


if __name__ == "__main__":
    main()
