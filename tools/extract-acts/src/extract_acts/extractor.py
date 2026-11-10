"""Extract action items and due dates from transcripts."""

from __future__ import annotations

import datetime
import re
import uuid
from typing import List, Optional

from extract_acts.models import ActionItem

WEEKDAYS = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

TASK_PREFIX_REGEX = re.compile(
    r"^(?:(?:TODO|Action item|Task|Action|AI):\s*|"
    r"[-*•]\s*(?:\[[ xX]\]\s*)?|"
    r"(?:we need to|please|let's|could you|should)\s+)",
    re.IGNORECASE,
)

DATE_PATTERNS = [
    # YYYY-MM-DD
    (re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b"), "%Y-%m-%d"),
    # YYYY/MM/DD
    (re.compile(r"\b(\d{4})/(\d{2})/(\d{2})\b"), "%Y/%m/%d"),
    # DD/MM/YYYY
    (re.compile(r"\b(\d{2})/(\d{2})/(\d{4})\b"), "%d/%m/%Y"),
]


def parse_relative_date(text: str, base_date: datetime.date) -> Optional[datetime.date]:
    """Parse relative expressions like 'today', 'tomorrow', 'next monday', 'by friday'."""
    lower = text.lower()

    if re.search(r"\btoday\b", lower):
        return base_date
    if re.search(r"\btomorrow\b", lower):
        return base_date + datetime.timedelta(days=1)

    # Next weekday or by <weekday>
    weekday_match = re.search(
        r"\b(?:by|next|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        lower,
    )
    if weekday_match:
        target_weekday = WEEKDAYS[weekday_match.group(1)]
        current_weekday = base_date.weekday()
        days_ahead = target_weekday - current_weekday
        if "next" in lower:
            days_ahead += 7 if days_ahead <= 0 else 7
        elif days_ahead <= 0:
            days_ahead += 7
        return base_date + datetime.timedelta(days=days_ahead)

    # in N days
    in_days_match = re.search(r"\bin\s+(\d+)\s+days?\b", lower)
    if in_days_match:
        return base_date + datetime.timedelta(days=int(in_days_match.group(1)))

    # in N weeks
    in_weeks_match = re.search(r"\bin\s+(\d+)\s+weeks?\b", lower)
    if in_weeks_match:
        return base_date + datetime.timedelta(weeks=int(in_weeks_match.group(1)))

    return None


def extract_due_date(
    text: str, base_date: Optional[datetime.date] = None
) -> Optional[datetime.date]:
    """Extract a due date from a text snippet."""
    if base_date is None:
        base_date = datetime.date.today()

    # Explicit date formats
    for pattern, fmt in DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            date_str = match.group(0)
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

    # Relative expressions
    return parse_relative_date(text, base_date)


def extract_assignee(text: str) -> Optional[str]:
    """Extract an assignee from phrases like '@alice' or 'assigned to Bob' or 'Alice to ...'."""
    at_match = re.search(r"@([a-zA-Z0-9_.-]+)", text)
    if at_match:
        return at_match.group(1)

    assigned_match = re.search(r"(?:assigned to|owner:)\s*([a-zA-Z0-9_.-]+)", text, re.IGNORECASE)
    if assigned_match:
        return assigned_match.group(1)

    return None


def extract_action_items(
    transcript: str, base_date: Optional[datetime.date] = None
) -> List[ActionItem]:
    """Parse transcript text into structured ActionItem objects."""
    if base_date is None:
        base_date = datetime.date.today()

    items: List[ActionItem] = []
    lines = transcript.strip().splitlines()

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        # Strip speaker prefix if present (e.g. "Bob: ")
        line_content = re.sub(r"^[A-Za-z0-9_.-]+:\s*", "", cleaned_line)

        # Check if line looks like an action item
        is_action = bool(TASK_PREFIX_REGEX.search(cleaned_line)) or bool(
            TASK_PREFIX_REGEX.search(line_content)
        )
        has_due_keyword = any(
            kw in cleaned_line.lower()
            for kw in ["due", "by", "deadline", "before", "tomorrow", "today"]
        )

        # Also look for lines like "Alice will submit report by Friday"
        has_intent = any(
            verb in cleaned_line.lower()
            for verb in [
                "will ",
                "shall ",
                "must ",
                "needs to ",
                "need to ",
                "to do",
                "fix ",
                "deploy ",
                "submit ",
                "update ",
            ]
        )

        if not (is_action or (has_intent and has_due_keyword)):
            continue

        # Determine task description by stripping bullet/prefix markers
        desc = TASK_PREFIX_REGEX.sub("", line_content).strip()
        if not desc:
            desc = line_content

        due_date = extract_due_date(cleaned_line, base_date=base_date)
        assignee = extract_assignee(cleaned_line)

        items.append(
            ActionItem(
                id=str(uuid.uuid4())[:8],
                description=desc,
                assignee=assignee,
                due_date=due_date,
                completed=False,
            )
        )

    return items
