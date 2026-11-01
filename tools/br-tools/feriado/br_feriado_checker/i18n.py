"""Internationalization (i18n) module for br-feriado-checker."""

import os
import locale as sys_locale

TRANSLATIONS = {
    "pt_BR": {
        "today_is_holiday": "Hoje ({date}) é feriado: {name} ({type})",
        "today_is_not_holiday": "Hoje ({date}) é um dia útil normal.",
        "date_is_holiday": "{date} é feriado: {name} ({type})",
        "date_is_not_holiday": "{date} é um dia útil normal.",
        "holiday_type_national": "Nacional",
        "holiday_type_state": "Estadual",
        "holiday_type_municipal": "Municipal",
        "cli_description": "Verifica se hoje (ou uma data específica) é feriado no Brasil.",
        "help_locale": "Localidade das mensagens (ex: pt_BR, pt, en)",
        "help_date": "Data para verificação no formato AAAA-MM-DD (padrão: hoje)",
        "help_state": "Sigla do Estado / UF (ex: SP, RJ)",
        "help_city": "Nome do Município (ex: São Paulo)",
        "invalid_date_format": "Formato de data inválido. Por favor, use AAAA-MM-DD.",
        "new_years_day": "Confraternização Universal",
        "tiradentes": "Tiradentes",
        "labor_day": "Dia do Trabalhador",
        "independence_day": "Independência do Brasil",
        "our_lady_of_aparecida": "Nossa Senhora Aparecida",
        "all_souls_day": "Finados",
        "proclamation_of_republic": "Proclamação da República",
        "black_awareness_day": "Dia Nacional de Zumbi e da Consciência Negra",
        "christmas": "Natal",
        "carnival": "Carnaval",
        "good_friday": "Sexta-feira Santa",
        "corpus_christi": "Corpus Christi",
    },
    "en": {
        "today_is_holiday": "Today ({date}) is a holiday: {name} ({type})",
        "today_is_not_holiday": "Today ({date}) is a regular working day.",
        "date_is_holiday": "{date} is a holiday: {name} ({type})",
        "date_is_not_holiday": "{date} is a regular working day.",
        "holiday_type_national": "National",
        "holiday_type_state": "State",
        "holiday_type_municipal": "Municipal",
        "cli_description": "Checks if today (or a specified date) is a holiday in Brazil.",
        "help_locale": "Locale for output messages (e.g. pt_BR, pt, en)",
        "help_date": "Date to check in YYYY-MM-DD format (default: today)",
        "help_state": "State code / UF (e.g. SP, RJ)",
        "help_city": "City name (e.g. São Paulo)",
        "invalid_date_format": "Invalid date format. Please use YYYY-MM-DD.",
        "new_years_day": "New Year's Day",
        "tiradentes": "Tiradentes Day",
        "labor_day": "Labor Day",
        "independence_day": "Independence Day",
        "our_lady_of_aparecida": "Our Lady of Aparecida",
        "all_souls_day": "All Souls' Day",
        "proclamation_of_republic": "Proclamation of the Republic",
        "black_awareness_day": "National Black Awareness Day",
        "christmas": "Christmas Day",
        "carnival": "Carnival",
        "good_friday": "Good Friday",
        "corpus_christi": "Corpus Christi",
    },
}

# Alias pt to pt_BR
TRANSLATIONS["pt"] = TRANSLATIONS["pt_BR"]


def normalize_locale(loc: str) -> str:
    """Normalize locale string to 'pt_BR', 'pt', or 'en'."""
    if not loc:
        return "pt_BR"
    loc_clean = loc.split(".")[0].replace("-", "_").lower()
    if loc_clean.startswith("pt"):
        return "pt_BR"
    if loc_clean.startswith("en"):
        return "en"
    return "pt_BR"


def detect_locale(cli_arg: str = None) -> str:
    """Detect locale preference from CLI argument, environment variables, or system settings."""
    if cli_arg:
        return normalize_locale(cli_arg)

    for env_var in ("LANGUAGE", "LC_ALL", "LC_MESSAGES", "LANG"):
        val = os.environ.get(env_var)
        if val:
            # Language variable might contain colon separated priority list like "pt_BR:pt:en"
            first_val = val.split(":")[0]
            if first_val:
                return normalize_locale(first_val)

    try:
        sys_loc, _ = sys_locale.getdefaultlocale()
        if sys_loc:
            return normalize_locale(sys_loc)
    except Exception:
        pass

    return "pt_BR"


def get_message(key: str, locale_name: str = None, **kwargs) -> str:
    """Retrieve translated string for a given key and locale."""
    norm_loc = normalize_locale(locale_name or detect_locale())
    translations = TRANSLATIONS.get(norm_loc, TRANSLATIONS["pt_BR"])
    msg = translations.get(key, TRANSLATIONS["pt_BR"].get(key, key))
    if kwargs:
        return msg.format(**kwargs)
    return msg
