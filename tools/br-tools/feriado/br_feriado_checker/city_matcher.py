import difflib
import unicodedata
from typing import List, Optional, Tuple

DEFAULT_BRAZILIAN_CITIES: List[str] = [
    # State Capitals & Federal District
    "Aracaju",
    "Belém",
    "Belo Horizonte",
    "Boa Vista",
    "Brasília",
    "Campo Grande",
    "Cuiabá",
    "Curitiba",
    "Florianópolis",
    "Fortaleza",
    "Goiânia",
    "João Pessoa",
    "Macapá",
    "Maceió",
    "Manaus",
    "Natal",
    "Palmas",
    "Porto Alegre",
    "Porto Velho",
    "Recife",
    "Rio Branco",
    "Rio de Janeiro",
    "Salvador",
    "São Luís",
    "São Paulo",
    "Teresina",
    "Vitória",
    # Other Major Municipalities
    "Ananindeua",
    "Aparecida de Goiânia",
    "Bauru",
    "Belford Roxo",
    "Betim",
    "Blumenau",
    "Campina Grande",
    "Campinas",
    "Campos dos Goytacazes",
    "Carapicuíba",
    "Caxias do Sul",
    "Contagem",
    "Diadema",
    "Duque de Caxias",
    "Feira de Santana",
    "Guarulhos",
    "Jaboatão dos Guararapes",
    "Joinville",
    "Juiz de Fora",
    "Jundiaí",
    "Londrina",
    "Maringá",
    "Mauá",
    "Mogi das Cruzes",
    "Montes Claros",
    "Niterói",
    "Nova Iguaçu",
    "Olinda",
    "Osasco",
    "Petrópolis",
    "Piracicaba",
    "Ribeirão Preto",
    "Santo André",
    "Santos",
    "São Bernardo do Campo",
    "São Gonçalo",
    "São José do Rio Preto",
    "São José dos Campos",
    "Serra",
    "Sorocaba",
    "Uberlândia",
    "Vila Velha",
]


def normalize_text(text: str) -> str:
    """
    Normalizes text by removing diacritics/accents, converting to lowercase,
    and stripping leading/trailing whitespace.
    """
    if not text:
        return ""
    # Normalize unicode to decomposed form (NFKD)
    nfkd_form = unicodedata.normalize("NFKD", text)
    # Filter out combining diacritical marks
    without_accents = "".join(c for c in nfkd_form if unicodedata.category(c) != "Mn")
    return without_accents.strip().lower()


class CityMatcher:
    """
    Fuzzy city matcher that matches input city names against a known list of cities.
    """

    def __init__(self, candidate_cities: Optional[List[str]] = None):
        self.candidate_cities = candidate_cities or DEFAULT_BRAZILIAN_CITIES
        self._build_index()

    def _build_index(self) -> None:
        self.normalized_map = {}
        self.normalized_list = []
        for city in self.candidate_cities:
            norm = normalize_text(city)
            if norm:
                # If duplicate normalized keys exist, keep first or original
                if norm not in self.normalized_map:
                    self.normalized_map[norm] = city
                    self.normalized_list.append(norm)

    def match(self, city_input: str, cutoff: float = 0.6) -> Optional[str]:
        """
        Finds the best matching city name for a given input string.

        Args:
            city_input: The input string representing a city name.
            cutoff: Minimum similarity score threshold (0.0 to 1.0) for fuzzy match.

        Returns:
            The canonical matched city string, or None if no match meets cutoff.
        """
        if not city_input or not city_input.strip():
            return None

        norm_input = normalize_text(city_input)

        # 1. Exact match on normalized text
        if norm_input in self.normalized_map:
            return self.normalized_map[norm_input]

        # 2. Fuzzy match on normalized text
        matches = difflib.get_close_matches(
            norm_input, self.normalized_list, n=1, cutoff=cutoff
        )
        if matches:
            best_norm_match = matches[0]
            return self.normalized_map[best_norm_match]

        return None


def match_city(
    city_input: str,
    candidate_cities: Optional[List[str]] = None,
    cutoff: float = 0.6,
) -> Optional[str]:
    """
    Convenience function to match a city input against candidate cities.

    Args:
        city_input: The input city string (e.g., 'sao paulo').
        candidate_cities: Optional list of valid city names. Defaults to Brazilian cities.
        cutoff: Similarity score cutoff threshold (default 0.6).

    Returns:
        Canonical city name if matched, else None.
    """
    matcher = CityMatcher(candidate_cities=candidate_cities)
    return matcher.match(city_input=city_input, cutoff=cutoff)
