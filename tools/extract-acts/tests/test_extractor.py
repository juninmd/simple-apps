"""Unit tests for transcript extraction and due date parsing."""

import datetime

from extract_acts.extractor import extract_action_items, extract_due_date, parse_relative_date


def test_extract_explicit_iso_date():
    text = "Deploy service by 2026-11-20"
    due = extract_due_date(text)
    assert due == datetime.date(2026, 11, 20)


def test_parse_relative_date_tomorrow():
    base = datetime.date(2026, 11, 5)  # Thursday
    due = parse_relative_date("finish review tomorrow", base)
    assert due == datetime.date(2026, 11, 6)


def test_parse_relative_date_weekday():
    base = datetime.date(2026, 11, 5)  # Thursday
    due = parse_relative_date("send slides by Friday", base)
    assert due == datetime.date(2026, 11, 6)


def test_parse_relative_date_in_days():
    base = datetime.date(2026, 11, 5)
    due = parse_relative_date("run benchmark in 3 days", base)
    assert due == datetime.date(2026, 11, 8)


def test_extract_action_items_from_transcript():
    transcript = """
    Team sync:
    - [ ] Setup CI pipeline by 2026-11-15 @dev
    TODO: Fix authentication headers tomorrow
    Bob: We need to update documentation by Friday
    Just casual discussion, nothing to do here.
    """
    base = datetime.date(2026, 11, 5)
    items = extract_action_items(transcript, base_date=base)

    assert len(items) == 3
    assert "Setup CI pipeline" in items[0].description
    assert items[0].due_date == datetime.date(2026, 11, 15)
    assert items[0].assignee == "dev"

    assert "Fix authentication headers" in items[1].description
    assert items[1].due_date == datetime.date(2026, 11, 6)

    assert "update documentation" in items[2].description
    assert items[2].due_date == datetime.date(2026, 11, 6)
