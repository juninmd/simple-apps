"""Google Calendar API integration service for proposing and creating calendar events."""

from __future__ import annotations

import datetime
import os
from typing import Any, Dict, Optional, Protocol

from google.auth.credentials import Credentials
from googleapiclient.discovery import build

from extract_acts.models import ActionItem, CalendarStatus


class CalendarClientProtocol(Protocol):
    """Protocol for Google Calendar API client."""

    def insert_event(self, calendar_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Insert an event into Google Calendar."""
        ...


class GoogleCalendarApiClient:
    """Live Google Calendar API v3 client using googleapiclient."""

    def __init__(
        self,
        credentials: Optional[Credentials] = None,
        service_account_file: Optional[str] = None,
    ) -> None:
        self.credentials = credentials
        self.service_account_file = service_account_file or os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS"
        )
        self._service = None

    def _get_service(self):
        if self._service is None:
            creds = self.credentials
            if not creds and self.service_account_file:
                from google.oauth2 import service_account

                creds = service_account.Credentials.from_service_account_file(
                    self.service_account_file,
                    scopes=["https://www.googleapis.com/auth/calendar.events"],
                )
            if creds:
                self._service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            else:
                # Fallback to application default credentials
                import google.auth

                default_creds, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/calendar.events"]
                )
                self._service = build(
                    "calendar", "v3", credentials=default_creds, cache_discovery=False
                )
        return self._service

    def insert_event(self, calendar_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        service = self._get_service()
        return service.events().insert(calendarId=calendar_id, body=body).execute()


class MockGoogleCalendarClient:
    """Mock Google Calendar client for testing and offline/dry-run use."""

    def __init__(self, failure: bool = False):
        self.failure = failure
        self.created_events: list[Dict[str, Any]] = []

    def insert_event(self, calendar_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        if self.failure:
            raise RuntimeError("Failed to connect to Google Calendar API")
        event_id = f"mock-cal-id-{len(self.created_events) + 1}"
        event_record = {
            "id": event_id,
            "calendarId": calendar_id,
            "status": "confirmed",
            "htmlLink": f"https://calendar.google.com/event?eid={event_id}",
            **body,
        }
        self.created_events.append(event_record)
        return event_record


class GoogleCalendarService:
    """Service to create and propose calendar entries from action items."""

    def __init__(
        self,
        calendar_id: str = "primary",
        client: Optional[CalendarClientProtocol] = None,
        credentials: Optional[Credentials] = None,
        dry_run: bool = False,
    ):
        self.calendar_id = calendar_id
        self.dry_run = dry_run
        if client:
            self._client = client
        elif dry_run:
            self._client = MockGoogleCalendarClient()
        else:
            self._client = GoogleCalendarApiClient(credentials=credentials)

    def build_event_payload(self, item: ActionItem) -> Dict[str, Any]:
        """Construct Google Calendar API v3 event resource payload."""
        if not item.due_date:
            raise ValueError(f"ActionItem '{item.id}' has no identified due date.")

        date_str = item.due_date.isoformat()
        # For an all-day event in Google Calendar, end date is exclusive (day after start)
        end_date = item.due_date + datetime.timedelta(days=1)
        end_date_str = end_date.isoformat()

        summary = f"[Task] {item.description}"
        description = f"Action Item extracted from meeting transcript.\nID: {item.id}"
        if item.assignee:
            description += f"\nAssignee: {item.assignee}"

        return {
            "summary": summary,
            "description": description,
            "start": {"date": date_str},
            "end": {"date": end_date_str},
            "reminders": {
                "useDefault": False,
                "overrides": [{"method": "popup", "minutes": 24 * 60}],
            },
        }

    def propose_calendar_entry(self, item: ActionItem) -> ActionItem:
        """Propose calendar entry for an ActionItem.

        If dry_run is True, marks status as PROPOSED without calling API.
        Otherwise calls insert_event to create the event.
        Updates item in-place and returns it.
        """
        if not item.due_date:
            item.calendar_status = CalendarStatus.FAILED
            item.calendar_error = "No due date identified for this task."
            return item

        payload = self.build_event_payload(item)

        if self.dry_run:
            item.calendar_status = CalendarStatus.PROPOSED
            item.calendar_error = None
            return item

        try:
            result = self._client.insert_event(self.calendar_id, payload)
            item.calendar_event_id = result.get("id")
            item.calendar_status = CalendarStatus.CREATED
            item.calendar_error = None
        except Exception as exc:
            item.calendar_status = CalendarStatus.FAILED
            item.calendar_error = str(exc)

        return item
