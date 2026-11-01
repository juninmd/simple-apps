import datetime
import unicodedata
from dataclasses import dataclass
from typing import List, Optional, Dict


@dataclass
class Holiday:
    date: datetime.date
    name: str
    type: str  # "national", "state", or "municipal"
    location: str  # "BR", UF code (e.g. "SP"), or Municipality Name (e.g. "São Paulo - SP")

    def to_dict(self) -> dict:
        return {
            "date": self.date.isoformat(),
            "name": self.name,
            "type": self.type,
            "location": self.location,
        }


def _calculate_easter(year: int) -> datetime.date:
    """Calculate Easter date using Anonymous Gregorian algorithm."""
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
    L = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * L) // 451
    month = (h + L - 7 * m + 114) // 31
    day = ((h + L - 7 * m + 114) % 31) + 1
    return datetime.date(year, month, day)


def _normalize_string(text: str) -> str:
    """Remove accents, convert to lower case, and trim whitespace."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", text)
    unaccented = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    return unaccented.strip().lower()


NATIONAL_FIXED_HOLIDAYS = [
    (1, 1, "Confraternização Universal"),
    (4, 21, "Tiradentes"),
    (5, 1, "Dia do Trabalhador"),
    (9, 7, "Independência do Brasil"),
    (10, 12, "Nossa Senhora Aparecida"),
    (11, 2, "Finados"),
    (11, 15, "Proclamação da República"),
    (11, 20, "Dia Nacional de Zumbi e da Consciência Negra"),
    (12, 25, "Natal"),
]

STATE_HOLIDAYS: Dict[str, List[tuple]] = {
    "AC": [(1, 23, "Dia do Evangélico"), (6, 15, "Aniversário do Estado do Acre"), (9, 5, "Dia da Amazônia"), (11, 17, "Assinatura do Tratado de Petrópolis")],
    "AL": [(6, 24, "São João"), (6, 29, "São Pedro"), (9, 16, "Emancipação Política de Alagoas"), (11, 20, "Dia da Consciência Negra")],
    "AM": [(9, 5, "Elevação do Amazonas à Categoria de Província"), (11, 20, "Dia da Consciência Negra")],
    "AP": [(3, 19, "Dia de São José"), (9, 13, "Criação do Território Federal do Amapá")],
    "BA": [(7, 2, "Independência da Bahia")],
    "CE": [(3, 25, "Data Magna do Ceará")],
    "DF": [(4, 21, "Fundação de Brasília"), (11, 30, "Dia do Evangélico")],
    "ES": [(10, 28, "Dia do Servidor Público")],
    "GO": [(10, 24, "Pedra Fundamental de Goiânia")],
    "MA": [(7, 28, "Adesão do Maranhão à Independência do Brasil")],
    "MG": [(4, 21, "Data Magna de Minas Gerais")],
    "MS": [(10, 11, "Criação do Estado do Mato Grosso do Sul")],
    "MT": [(11, 20, "Dia da Consciência Negra")],
    "PA": [(8, 15, "Adesão do Pará à Independência do Brasil")],
    "PB": [(8, 5, "Fundação do Estado da Paraíba")],
    "PE": [(3, 6, "Data Magna de Pernambuco")],
    "PI": [(10, 19, "Dia do Piauí")],
    "PR": [(12, 19, "Emancipação Política do Paraná")],
    "RJ": [(4, 23, "Dia de São Jorge"), (11, 20, "Dia da Consciência Negra")],
    "RN": [(10, 3, "Dia dos Mártires de Cunhaú e Uruaçu")],
    "RO": [(1, 4, "Criação do Estado de Rondônia"), (6, 18, "Dia do Evangélico")],
    "RR": [(10, 5, "Criação de Roraima")],
    "RS": [(9, 20, "Revolução Farroupilha")],
    "SC": [(8, 11, "Criação da Capitania de Santa Catarina")],
    "SE": [(7, 8, "Emancipação Política de Sergipe")],
    "SP": [(7, 9, "Revolução Constitucionalista de 1932")],
    "TO": [(3, 18, "Autonomia do Estado do Tocantins"), (10, 5, "Criação do Estado do Tocantins")],
}

# Municipal holidays defined as: (month, day, name) or moveable ("sexta_feira_santa", "corpus_christi", name)
MUNICIPAL_HOLIDAYS: Dict[str, Dict[str, List[tuple]]] = {
    "SP": {
        "sao paulo": [
            (1, 25, "Aniversário da Cidade de São Paulo"),
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (11, 20, "Dia da Consciência Negra"),
        ],
        "campinas": [
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (11, 20, "Dia da Consciência Negra"),
            (12, 8, "Dia de Nossa Senhora da Conceição"),
        ],
        "santos": [
            (1, 26, "Aniversário de Santos"),
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (9, 8, "Nossa Senhora do Monte Serrat"),
        ],
    },
    "RJ": {
        "rio de janeiro": [
            (1, 20, "Dia de São Sebastião"),
            (1, 25, "Aniversário da Cidade do Rio de Janeiro"),
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
        ],
        "niteroi": [
            (6, 24, "Dia de São João Batista"),
            (11, 22, "Aniversário de Niterói"),
            (12, 8, "Nossa Senhora da Conceição"),
        ],
    },
    "MG": {
        "belo horizonte": [
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (8, 15, "Dia de Nossa Senhora da Boa Viagem"),
            (12, 8, "Dia de Nossa Senhora da Conceição"),
        ],
    },
    "BA": {
        "salvador": [
            (2, 2, "Dia de Iemanjá"),
            (3, 29, "Aniversário de Salvador"),
            (6, 24, "Dia de São João"),
            (12, 8, "Nossa Senhora da Conceição da Praia"),
        ],
    },
    "PE": {
        "recife": [
            (3, 12, "Aniversário do Recife"),
            (6, 24, "Dia de São João"),
            (7, 16, "Dia de Nossa Senhora do Carmo"),
            (12, 8, "Dia de Nossa Senhora da Conceição"),
        ],
    },
    "RS": {
        "porto alegre": [
            (2, 2, "Nossa Senhora dos Navegantes"),
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (12, 2, "Dia de Nossa Senhora da Conceição"),
        ],
    },
    "PR": {
        "curitiba": [
            (3, 29, "Aniversário de Curitiba"),
            ("sexta_feira_santa", "Sexta-feira Santa"),
            ("corpus_christi", "Corpus Christi"),
            (9, 8, "Nossa Senhora da Luz dos Pinhais"),
        ],
    },
    "CE": {
        "fortaleza": [
            (3, 19, "Dia de São José"),
            (4, 13, "Aniversário de Fortaleza"),
            (8, 15, "Nossa Senhora da Assunção"),
            (12, 8, "Nossa Senhora da Conceição"),
        ],
    },
    "DF": {
        "brasilia": [
            (4, 21, "Aniversário de Brasília"),
            (11, 30, "Dia do Evangélico"),
        ],
    },
}


def get_holidays(
    year: int,
    state: Optional[str] = None,
    city: Optional[str] = None,
    holiday_type: Optional[str] = None,
) -> List[Holiday]:
    """Retrieve holidays for a given year, optionally filtered by state, city, and holiday type.

    holiday_type can be: "national", "state", "municipal", "all", or None (returns all applicable).
    """
    holidays: List[Holiday] = []

    easter = _calculate_easter(year)
    carnaval = easter - datetime.timedelta(days=47)
    sexta_feira_santa = easter - datetime.timedelta(days=2)
    corpus_christi = easter + datetime.timedelta(days=60)

    # Moveable national holidays
    moveable_national = [
        (carnaval, "Carnaval"),
        (sexta_feira_santa, "Sexta-feira Santa"),
        (corpus_christi, "Corpus Christi"),
    ]

    # 1. National Holidays
    if holiday_type in (None, "national", "all"):
        for m, d, name in NATIONAL_FIXED_HOLIDAYS:
            holidays.append(Holiday(date=datetime.date(year, m, d), name=name, type="national", location="BR"))
        for h_date, name in moveable_national:
            holidays.append(Holiday(date=h_date, name=name, type="national", location="BR"))

    # 2. State Holidays
    upper_state = state.upper().strip() if state else None
    if holiday_type in (None, "state", "all"):
        if upper_state:
            state_list = [upper_state] if upper_state in STATE_HOLIDAYS else []
        else:
            state_list = list(STATE_HOLIDAYS.keys()) if holiday_type in ("state", "all") else []

        for st in state_list:
            for item in STATE_HOLIDAYS.get(st, []):
                m, d, name = item
                holidays.append(Holiday(date=datetime.date(year, m, d), name=name, type="state", location=st))

    # 3. Municipal Holidays
    if holiday_type in (None, "municipal", "all"):
        norm_city = _normalize_string(city) if city else None

        # Search through MUNICIPAL_HOLIDAYS
        for st, cities_dict in MUNICIPAL_HOLIDAYS.items():
            if upper_state and st != upper_state:
                continue
            for city_key, city_holidays in cities_dict.items():
                if norm_city and norm_city != _normalize_string(city_key):
                    continue
                # If city wasn't explicitly specified and type wasn't municipal/all, skip listing all cities by default
                if not norm_city and holiday_type not in ("municipal", "all"):
                    continue

                location_label = f"{city_key.title()} - {st}"
                for item in city_holidays:
                    m_or_moveable, d_or_name, *rest = item
                    if isinstance(m_or_moveable, str):
                        m_type = m_or_moveable
                        h_name = d_or_name
                        if m_type == "sexta_feira_santa":
                            h_date = sexta_feira_santa
                        elif m_type == "corpus_christi":
                            h_date = corpus_christi
                        elif m_type == "carnaval":
                            h_date = carnaval
                        else:
                            continue
                    else:
                        h_date = datetime.date(year, m_or_moveable, d_or_name)
                        h_name = rest[0] if rest else ""

                    holidays.append(
                        Holiday(
                            date=h_date,
                            name=h_name,
                            type="municipal",
                            location=location_label,
                        )
                    )

    # Remove duplicates if any (same date, name, type, location)
    unique_holidays = []
    seen = set()
    for h in sorted(holidays, key=lambda x: (x.date, x.name)):
        key = (h.date, h.name, h.type, h.location)
        if key not in seen:
            seen.add(key)
            unique_holidays.append(h)

    return unique_holidays
