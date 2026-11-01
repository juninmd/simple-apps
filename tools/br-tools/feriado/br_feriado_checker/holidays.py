"""Brazilian holiday calculations module."""

import datetime
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Holiday:
    date: datetime.date
    name: str
    type: str  # "Nacional", "Estadual", "Municipal"
    description: str = ""


def get_easter_sunday(year: int) -> datetime.date:
    """Calculate Easter Sunday using Meeus/Jones/Butcher algorithm."""
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


def get_national_holidays(year: int) -> List[Holiday]:
    """Return national holidays for a given year."""
    easter = get_easter_sunday(year)

    holidays = [
        # Fixed national holidays
        Holiday(datetime.date(year, 1, 1), "Confraternização Universal", "Nacional", "Ano Novo"),
        Holiday(datetime.date(year, 4, 21), "Tiradentes", "Nacional", "Dia de Tiradentes"),
        Holiday(datetime.date(year, 5, 1), "Dia do Trabalhador", "Nacional", "Dia Mundial do Trabalho"),
        Holiday(datetime.date(year, 9, 7), "Independência do Brasil", "Nacional", "Sete de Setembro"),
        Holiday(datetime.date(year, 10, 12), "Nossa Senhora Aparecida", "Nacional", "Padroeira do Brasil"),
        Holiday(datetime.date(year, 11, 2), "Finados", "Nacional", "Dia de Finados"),
        Holiday(datetime.date(year, 11, 15), "Proclamação da República", "Nacional", "Proclamação da República"),
        Holiday(datetime.date(year, 11, 20), "Dia Nacional de Zumbi e da Consciência Negra", "Nacional", "Consciência Negra"),
        Holiday(datetime.date(year, 12, 25), "Natal", "Nacional", "Natal"),

        # Movable Easter-based national holidays
        Holiday(easter - datetime.timedelta(days=48), "Carnaval (Segunda-feira)", "Nacional", "Carnaval"),
        Holiday(easter - datetime.timedelta(days=47), "Carnaval (Terça-feira)", "Nacional", "Carnaval"),
        Holiday(easter - datetime.timedelta(days=2), "Sexta-Feira Santa", "Nacional", "Paixão de Cristo"),
        Holiday(easter, "Páscoa", "Nacional", "Domingo de Páscoa"),
        Holiday(easter + datetime.timedelta(days=60), "Corpus Christi", "Nacional", "Corpus Christi"),
    ]

    return sorted(holidays, key=lambda h: h.date)


STATE_HOLIDAYS = {
    "SP": [
        (7, 9, "Revolução Constitucionalista"),
    ],
    "RJ": [
        (4, 23, "Dia de São Jorge"),
        (11, 20, "Dia da Consciência Negra (Estadual)"),
    ],
    "MG": [
        (4, 21, "Data Magna de Minas Gerais"),
    ],
    "RS": [
        (9, 20, "Revolução Farroupilha"),
    ],
    "BA": [
        (7, 2, "Independência da Bahia"),
    ],
}

CITY_HOLIDAYS = {
    "SP": {
        "sao paulo": [
            (1, 25, "Aniversário da Cidade de São Paulo"),
            (12, 8, "Nossa Senhora da Conceição"),
        ]
    },
    "RJ": {
        "rio de janeiro": [
            (1, 20, "Dia de São Sebastião"),
        ]
    }
}


def get_state_holidays(year: int, state: str) -> List[Holiday]:
    """Return state holidays for a given state and year."""
    state_code = state.upper()
    if state_code not in STATE_HOLIDAYS:
        return []

    holidays = []
    for month, day, name in STATE_HOLIDAYS[state_code]:
        holidays.append(Holiday(datetime.date(year, month, day), name, "Estadual", f"Feriado estadual ({state_code})"))
    return holidays


def get_city_holidays(year: int, state: str, city: str) -> List[Holiday]:
    """Return city holidays for a given city, state and year."""
    state_code = state.upper()
    city_key = city.strip().lower()
    if state_code not in CITY_HOLIDAYS or city_key not in CITY_HOLIDAYS[state_code]:
        return []

    holidays = []
    for month, day, name in CITY_HOLIDAYS[state_code][city_key]:
        holidays.append(Holiday(datetime.date(year, month, day), name, "Municipal", f"Feriado municipal ({city.title()})"))
    return holidays


def get_holidays(year: int, state: Optional[str] = None, city: Optional[str] = None) -> List[Holiday]:
    """Get all applicable holidays for a year, state, and city."""
    holidays = get_national_holidays(year)

    if state:
        holidays.extend(get_state_holidays(year, state))
        if city:
            holidays.extend(get_city_holidays(year, state, city))

    # Deduplicate holidays on the same date with exact same name
    unique_holidays = {}
    for h in sorted(holidays, key=lambda x: x.date):
        key = (h.date, h.name)
        if key not in unique_holidays:
            unique_holidays[key] = h

    return list(unique_holidays.values())


def is_holiday(check_date: datetime.date, state: Optional[str] = None, city: Optional[str] = None) -> Optional[Holiday]:
    """Check if a specific date is a holiday."""
    holidays = get_holidays(check_date.year, state, city)
    for h in holidays:
        if h.date == check_date:
            return h
    return None
