import datetime
from typing import Optional, Dict, Any, List
from br_feriado_checker.cache import CacheManager
from br_feriado_checker.ibge import IBGEClient, normalize_text
from br_feriado_checker.holidays import get_national_holidays, get_state_holidays


def _are_similar_holidays(h1: Dict[str, Any], h2: Dict[str, Any]) -> bool:
    """Check if two holiday entries represent the same holiday event."""
    if h1["date"] != h2["date"]:
        return False
    norm1 = normalize_text(h1["name"])
    norm2 = normalize_text(h2["name"])
    if norm1 == norm2:
        return True
    # Check key holiday keywords overlap on same date (e.g., 'consciência negra')
    keywords = ["consciencias negra", "consciência negra", "tiradentes", "sao jorge", "evangelico"]
    for kw in keywords:
        norm_kw = normalize_text(kw)
        if norm_kw in norm1 and norm_kw in norm2:
            return True
    return False


class HolidayChecker:
    """
    Core engine for checking national, state, and municipal holidays
    with IBGE API fallback and local caching.
    """

    def __init__(self, cache: Optional[CacheManager] = None, ibge_client: Optional[IBGEClient] = None):
        self.cache = cache or CacheManager()
        self.ibge = ibge_client or IBGEClient(cache=self.cache)

    def check_holiday(
        self,
        date_str: Optional[str] = None,
        city: Optional[str] = None,
        uf: Optional[str] = None,
        ibge_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Check if a given date (default today) is a holiday for specified location.
        """
        if not date_str:
            date_str = datetime.date.today().strftime("%Y-%m-%d")

        try:
            parsed_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}. Expected YYYY-MM-DD.")

        year = parsed_date.year

        muni_info = None
        if ibge_code:
            muni_info = self.ibge.get_municipality_by_code(ibge_code)
        elif city and uf:
            muni_info = self.ibge.resolve_municipality(city, uf)

        resolved_city = muni_info.get("nome") if muni_info else city
        resolved_uf = muni_info.get("uf") if muni_info else (uf.upper() if uf else None)
        resolved_ibge = muni_info.get("id") if muni_info else ibge_code

        all_holidays: List[Dict[str, Any]] = []

        # 1. National Holidays
        national_list = get_national_holidays(year)
        all_holidays.extend(national_list)

        # 2. State Holidays
        if resolved_uf:
            state_list = get_state_holidays(resolved_uf, year)
            for sh in state_list:
                if not any(_are_similar_holidays(sh, existing) for existing in all_holidays):
                    all_holidays.append(sh)

        # 3. Municipal Holidays (via IBGE API fallback & caching)
        if resolved_ibge:
            muni_list = self.ibge.fetch_municipal_holidays_fallback(resolved_ibge, year)
            for h in muni_list:
                if not any(_are_similar_holidays(h, existing) for existing in all_holidays):
                    all_holidays.append(h)

        # Filter holidays matching target date_str
        matching_holidays = [h for h in all_holidays if h["date"] == date_str]

        return {
            "date": date_str,
            "is_holiday": len(matching_holidays) > 0,
            "location": {
                "city": resolved_city,
                "uf": resolved_uf,
                "ibge_code": resolved_ibge,
            },
            "holidays": matching_holidays,
        }
