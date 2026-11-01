"""Batch processing logic for checking multiple dates."""

from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from br_feriado_checker.holidays import is_holiday, parse_date


def check_single_date(
    d: Union[str, date],
    uf: Optional[str] = None,
    city: Optional[str] = None,
) -> Dict[str, Any]:
    """Check status of a single date and return standard result dict."""
    parsed_d = parse_date(d)
    is_non_working, name, category = is_holiday(parsed_d, uf=uf, city=city)
    day_of_week = parsed_d.strftime("%A")
    return {
        "date": parsed_d.isoformat(),
        "day_of_week": day_of_week,
        "is_working_day": not is_non_working,
        "is_holiday": is_non_working and category != "Working Day" and not category.startswith("Weekend"),
        "is_weekend": category.startswith("Weekend"),
        "holiday_name": name,
        "category": category,
    }


def check_dates_list(
    dates: List[Union[str, date]],
    uf: Optional[str] = None,
    city: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Check a list of dates or comma-separated date strings."""
    results = []
    for date_item in dates:
        if isinstance(date_item, str) and "," in date_item:
            sub_dates = [s.strip() for s in date_item.split(",") if s.strip()]
            for sd in sub_dates:
                results.append(check_single_date(sd, uf=uf, city=city))
        else:
            if isinstance(date_item, str) and not date_item.strip():
                continue
            results.append(check_single_date(date_item, uf=uf, city=city))
    return results


def check_date_range(
    start_date: Union[str, date],
    end_date: Union[str, date],
    uf: Optional[str] = None,
    city: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Check every date in range [start_date, end_date] inclusive (ideal for sprint planning)."""
    start = parse_date(start_date)
    end = parse_date(end_date)
    if start > end:
        raise ValueError(f"start_date ({start}) cannot be after end_date ({end})")

    results = []
    curr = start
    while curr <= end:
        results.append(check_single_date(curr, uf=uf, city=city))
        curr += timedelta(days=1)
    return results


def parse_dates_from_file(filepath: Union[str, Path]) -> List[str]:
    """Parse dates from a text or CSV file (one date per line or comma/newline separated)."""
    file_path = Path(filepath)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    dates = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue
            # Handle comma separated values on line
            parts = [p.strip() for p in line_str.split(",") if p.strip()]
            dates.extend(parts)
    return dates
