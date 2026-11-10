"""Domain models for extract-acts."""

from __future__ import annotations

import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CalendarStatus(str, Enum):
    """Calendar sync status for an action item."""

    NONE = "none"
    PROPOSED = "proposed"
    CREATED = "created"
    FAILED = "failed"


class ActionItem(BaseModel):
    """Represents an actionable task extracted from a transcript."""

    id: str = Field(description="Unique identifier for the action item")
    description: str = Field(description="Summary or task description")
    assignee: Optional[str] = Field(default=None, description="Person responsible")
    due_date: Optional[datetime.date] = Field(
        default=None, description="Identified due date for the task"
    )
    completed: bool = Field(default=False, description="Whether the task is checked off")
    calendar_event_id: Optional[str] = Field(
        default=None, description="Google Calendar event ID if created"
    )
    calendar_status: CalendarStatus = Field(
        default=CalendarStatus.NONE, description="Status of calendar entry proposal"
    )
    calendar_error: Optional[str] = Field(
        default=None, description="Error message if calendar creation failed"
    )
