"""Schema definitions and validation for extracted action items."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Status(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class ValidationError(ValueError):
    """Raised when an action item or extraction payload violates schema rules."""
    pass


@dataclass
class ActionItem:
    description: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    status: Status = Status.TODO
    context: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "description": self.description,
            "assignee": self.assignee,
            "due_date": self.due_date,
            "priority": self.priority.value,
            "status": self.status.value,
            "context": self.context,
        }


@dataclass
class ExtractionResult:
    meeting_title: Optional[str] = None
    summary: Optional[str] = None
    action_items: List[ActionItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "meeting_title": self.meeting_title,
            "summary": self.summary,
            "action_items": [item.to_dict() for item in self.action_items],
        }


def validate_action_item_dict(data: Any) -> ActionItem:
    """Validates raw dictionary data for an ActionItem."""
    if not isinstance(data, dict):
        raise ValidationError(f"Action item must be a dictionary, got {type(data).__name__}")

    raw_description = data.get("description")
    if not raw_description or not isinstance(raw_description, str) or not raw_description.strip():
        raise ValidationError("Action item description is required and must be a non-empty string")

    assignee = data.get("assignee")
    if assignee is not None and not isinstance(assignee, str):
        raise ValidationError(f"Assignee must be a string or None, got {type(assignee).__name__}")
    if isinstance(assignee, str):
        assignee = assignee.strip() or None

    due_date = data.get("due_date")
    if due_date is not None and not isinstance(due_date, str):
        raise ValidationError(f"due_date must be a string or None, got {type(due_date).__name__}")
    if isinstance(due_date, str):
        due_date = due_date.strip() or None

    raw_priority = data.get("priority", Priority.MEDIUM.value)
    if isinstance(raw_priority, Priority):
        priority = raw_priority
    elif isinstance(raw_priority, str):
        try:
            priority = Priority(raw_priority.strip().lower())
        except ValueError:
            raise ValidationError(
                f"Invalid priority '{raw_priority}'. Must be one of: {[p.value for p in Priority]}"
            )
    else:
        raise ValidationError(f"Priority must be a string, got {type(raw_priority).__name__}")

    raw_status = data.get("status", Status.TODO.value)
    if isinstance(raw_status, Status):
        status = raw_status
    elif isinstance(raw_status, str):
        try:
            status = Status(raw_status.strip().lower())
        except ValueError:
            raise ValidationError(
                f"Invalid status '{raw_status}'. Must be one of: {[s.value for s in Status]}"
            )
    else:
        raise ValidationError(f"Status must be a string, got {type(raw_status).__name__}")

    context = data.get("context")
    if context is not None and not isinstance(context, str):
        raise ValidationError(f"Context must be a string or None, got {type(context).__name__}")
    if isinstance(context, str):
        context = context.strip() or None

    return ActionItem(
        description=raw_description.strip(),
        assignee=assignee,
        due_date=due_date,
        priority=priority,
        status=status,
        context=context,
    )


def validate_extraction_dict(data: Any) -> ExtractionResult:
    """Validates raw dictionary data for full ExtractionResult."""
    if not isinstance(data, dict):
        raise ValidationError(f"Extraction result must be a dictionary, got {type(data).__name__}")

    meeting_title = data.get("meeting_title")
    if meeting_title is not None and not isinstance(meeting_title, str):
        raise ValidationError(f"meeting_title must be a string or None, got {type(meeting_title).__name__}")
    if isinstance(meeting_title, str):
        meeting_title = meeting_title.strip() or None

    summary = data.get("summary")
    if summary is not None and not isinstance(summary, str):
        raise ValidationError(f"summary must be a string or None, got {type(summary).__name__}")
    if isinstance(summary, str):
        summary = summary.strip() or None

    raw_items = data.get("action_items")
    if raw_items is None:
        raw_items = []
    elif not isinstance(raw_items, list):
        raise ValidationError(f"action_items must be a list, got {type(raw_items).__name__}")

    action_items = [validate_action_item_dict(item) for item in raw_items]

    return ExtractionResult(
        meeting_title=meeting_title,
        summary=summary,
        action_items=action_items,
    )
