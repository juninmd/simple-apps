"""iCal/ICS calendar generator module for holidays subscription."""

import datetime
import hashlib
from typing import List, Optional
from br_feriado_checker.holidays import Holiday


def _escape_text(value: str) -> str:
    """Escape a TEXT property value as required by RFC 5545 section 3.3.11."""
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def generate_ics(
    holidays: List[Holiday],
    calendar_name: str = "Feriados do Brasil",
    prodid: str = "-//BR Feriado Checker//NONSGML Holiday Feed//PT"
) -> str:
    """Generate RFC 5545 compliant iCalendar (.ics) string from a list of holidays."""

    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{prodid}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escape_text(calendar_name)}",
        "X-WR-TIMEZONE:America/Sao_Paulo",
    ]

    for holiday in holidays:
        start_str = holiday.date.strftime("%Y%m%d")
        end_date = holiday.date + datetime.timedelta(days=1)
        end_str = end_date.strftime("%Y%m%d")

        # Deterministic unique ID for the holiday event across runs
        name_hash = hashlib.sha256(holiday.name.encode("utf-8")).hexdigest()[:12]
        uid = f"holiday-{holiday.date.isoformat()}-{name_hash}@br-feriado-checker"

        description = holiday.description or f"Feriado {holiday.type}"
        if holiday.type:
            description = f"Tipo: {holiday.type}. {description}"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_utc}",
            f"DTSTART;VALUE=DATE:{start_str}",
            f"DTEND;VALUE=DATE:{end_str}",
            f"SUMMARY:{_escape_text(holiday.name)}",
            f"DESCRIPTION:{_escape_text(description)}",
            "STATUS:CONFIRMED",
            "TRANSP:TRANSPARENT",  # Free/Busy status: Free (doesn't block calendar availability)
            "END:VEVENT"
        ])

    lines.append("END:VCALENDAR")

    return "\r\n".join(lines) + "\r\n"
