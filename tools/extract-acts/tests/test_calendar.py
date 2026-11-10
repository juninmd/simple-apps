"""Unit tests for Google Calendar API service."""

import datetime
from unittest.mock import MagicMock

import pytest

from extract_acts.calendar_service import (
    GoogleCalendarApiClient,
    GoogleCalendarService,
    MockGoogleCalendarClient,
)
from extract_acts.models import ActionItem, CalendarStatus


def test_build_event_payload():
    service = GoogleCalendarService(dry_run=True)
    item = ActionItem(
        id="act-123",
        description="Ship v1 release",
        assignee="alice",
        due_date=datetime.date(2026, 11, 10),
    )
    payload = service.build_event_payload(item)

    assert payload["summary"] == "[Task] Ship v1 release"
    assert "Assignee: alice" in payload["description"]
    assert payload["start"]["date"] == "2026-11-10"
    assert payload["end"]["date"] == "2026-11-11"


def test_build_event_payload_no_due_date_raises():
    service = GoogleCalendarService(dry_run=True)
    item = ActionItem(id="act-123", description="Task without date")
    with pytest.raises(ValueError, match="has no identified due date"):
        service.build_event_payload(item)


def test_google_calendar_api_client_mocked():
    mock_creds = MagicMock()
    client = GoogleCalendarApiClient(credentials=mock_creds)

    mock_service = MagicMock()
    mock_events = MagicMock()
    mock_insert = MagicMock()
    mock_insert.execute.return_value = {"id": "real-gcal-123", "status": "confirmed"}
    mock_events.insert.return_value = mock_insert
    mock_service.events.return_value = mock_events
    client._service = mock_service

    service = GoogleCalendarService(client=client)
    item = ActionItem(
        id="act-real",
        description="Real API Task",
        due_date=datetime.date(2026, 11, 25),
    )
    result = service.propose_calendar_entry(item)

    assert result.calendar_status == CalendarStatus.CREATED
    assert result.calendar_event_id == "real-gcal-123"
    mock_events.insert.assert_called_once_with(
        calendarId="primary", body=service.build_event_payload(item)
    )


def test_propose_calendar_entry_success():
    mock_client = MockGoogleCalendarClient()
    service = GoogleCalendarService(client=mock_client)

    item = ActionItem(
        id="act-101",
        description="Submit taxes",
        due_date=datetime.date(2026, 12, 1),
    )

    result = service.propose_calendar_entry(item)

    assert result.calendar_status == CalendarStatus.CREATED
    assert result.calendar_event_id == "mock-cal-id-1"
    assert len(mock_client.created_events) == 1
    assert mock_client.created_events[0]["start"]["date"] == "2026-12-01"


def test_propose_calendar_entry_dry_run():
    mock_client = MockGoogleCalendarClient()
    service = GoogleCalendarService(client=mock_client, dry_run=True)

    item = ActionItem(
        id="act-102",
        description="Dry run task",
        due_date=datetime.date(2026, 12, 5),
    )

    result = service.propose_calendar_entry(item)

    assert result.calendar_status == CalendarStatus.PROPOSED
    assert result.calendar_event_id is None
    assert len(mock_client.created_events) == 0


def test_propose_calendar_entry_failure_handled():
    mock_client = MockGoogleCalendarClient(failure=True)
    service = GoogleCalendarService(client=mock_client)

    item = ActionItem(
        id="act-103",
        description="Failing API task",
        due_date=datetime.date(2026, 12, 10),
    )

    result = service.propose_calendar_entry(item)

    assert result.calendar_status == CalendarStatus.FAILED
    assert "Failed to connect" in (result.calendar_error or "")


def test_propose_calendar_entry_without_due_date():
    mock_client = MockGoogleCalendarClient()
    service = GoogleCalendarService(client=mock_client)

    item = ActionItem(id="act-104", description="No due date task")
    result = service.propose_calendar_entry(item)

    assert result.calendar_status == CalendarStatus.FAILED
    assert "No due date" in (result.calendar_error or "")
