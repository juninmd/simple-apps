#!/usr/bin/env python3
"""
Script to fetch and update Brazilian national holiday data.
Saves updated data to data/holidays.json.
"""

import json
import os
import datetime
import urllib.request
import urllib.error

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "holidays.json")


def fetch_holidays_from_api(year: int):
    """Fetch national holidays for a given year from Brasil API."""
    url = f"https://brasilapi.com.br/api/feriados/v1/{year}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "br-feriado-checker/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data
    except Exception as e:
        print(f"Warning: Could not fetch from API for year {year}: {e}")
    return None


def calculate_easter(year: int) -> datetime.date:
    """Calculate Easter Sunday for a given year using Anonymous Gregorian algorithm."""
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime.date(year, month, day)


def get_fallback_holidays(year: int):
    """Generate national holidays for a given year using standard Brazilian holiday rules."""
    easter = calculate_easter(year)
    carnaval = easter - datetime.timedelta(days=47)
    sexta_santa = easter - datetime.timedelta(days=2)
    corpus_christi = easter + datetime.timedelta(days=60)

    fixed_holidays = [
        (f"{year}-01-01", "Confraternização Universal", "national"),
        (carnaval.strftime("%Y-%m-%d"), "Carnaval", "national"),
        (sexta_santa.strftime("%Y-%m-%d"), "Sexta-feira Santa", "national"),
        (easter.strftime("%Y-%m-%d"), "Páscoa", "national"),
        (f"{year}-04-21", "Tiradentes", "national"),
        (f"{year}-05-01", "Dia do Trabalhador", "national"),
        (corpus_christi.strftime("%Y-%m-%d"), "Corpus Christi", "national"),
        (f"{year}-09-07", "Independência do Brasil", "national"),
        (f"{year}-10-12", "Nossa Senhora Aparecida", "national"),
        (f"{year}-11-02", "Finados", "national"),
        (f"{year}-11-15", "Proclamação da República", "national"),
        (f"{year}-11-20", "Dia Nacional de Zumbi e da Consciência Negra", "national"),
        (f"{year}-12-25", "Natal", "national"),
    ]

    holidays = []
    for date_str, name, h_type in fixed_holidays:
        holidays.append({
            "date": date_str,
            "name": name,
            "type": h_type
        })
    return holidays


def update_holidays(start_year: int = None, end_year: int = None):
    """Update holiday dataset for a range of years."""
    current_year = datetime.datetime.now().year
    if start_year is None:
        start_year = current_year - 1
    if end_year is None:
        end_year = current_year + 2

    all_holidays = []

    for year in range(start_year, end_year + 1):
        api_data = fetch_holidays_from_api(year)
        if api_data and isinstance(api_data, list):
            for item in api_data:
                all_holidays.append({
                    "date": item.get("date"),
                    "name": item.get("name"),
                    "type": item.get("type", "national")
                })
        else:
            print(f"Using fallback calculation for year {year}")
            fallback_data = get_fallback_holidays(year)
            all_holidays.extend(fallback_data)

    # Deduplicate and sort by date
    unique_holidays = {}
    for h in all_holidays:
        key = (h["date"], h["name"])
        unique_holidays[key] = h

    sorted_holidays = sorted(unique_holidays.values(), key=lambda x: x["date"])

    data = {
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "holidays": sorted_holidays
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated {len(sorted_holidays)} holidays in {DATA_FILE}")
    return sorted_holidays


if __name__ == "__main__":
    update_holidays()
