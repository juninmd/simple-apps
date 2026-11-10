import pytest
from extract_acts.schema import (
    ActionItem,
    ExtractionResult,
    Priority,
    Status,
    ValidationError,
    validate_action_item_dict,
    validate_extraction_dict,
)


def test_action_item_defaults_and_dict():
    item = ActionItem(description="Follow up with team")
    assert item.description == "Follow up with team"
    assert item.assignee is None
    assert item.due_date is None
    assert item.priority == Priority.MEDIUM
    assert item.status == Status.TODO
    assert item.context is None

    as_dict = item.to_dict()
    assert as_dict == {
        "description": "Follow up with team",
        "assignee": None,
        "due_date": None,
        "priority": "medium",
        "status": "todo",
        "context": None,
    }


def test_extraction_result_defaults_and_dict():
    res = ExtractionResult()
    assert res.meeting_title is None
    assert res.summary is None
    assert res.action_items == []
    assert res.to_dict() == {
        "meeting_title": None,
        "summary": None,
        "action_items": [],
    }

    item = ActionItem(description="Review PR", assignee="Alice", priority=Priority.HIGH)
    res_with_item = ExtractionResult(
        meeting_title="Sprint Planning",
        summary="Sprint 4 kickoff",
        action_items=[item],
    )
    assert len(res_with_item.action_items) == 1
    assert res_with_item.to_dict()["action_items"][0]["description"] == "Review PR"


def test_validate_action_item_dict_valid():
    raw = {
        "description": "  Submit expense report  ",
        "assignee": "  Bob  ",
        "due_date": "  2026-12-01  ",
        "priority": "high",
        "status": "in_progress",
        "context": "  Discussed during budget update  ",
    }
    item = validate_action_item_dict(raw)
    assert item.description == "Submit expense report"
    assert item.assignee == "Bob"
    assert item.due_date == "2026-12-01"
    assert item.priority == Priority.HIGH
    assert item.status == Status.IN_PROGRESS
    assert item.context == "Discussed during budget update"


def test_validate_action_item_dict_enum_types():
    raw = {
        "description": "Fix bug",
        "priority": Priority.CRITICAL,
        "status": Status.DONE,
    }
    item = validate_action_item_dict(raw)
    assert item.priority == Priority.CRITICAL
    assert item.status == Status.DONE


def test_validate_action_item_dict_empty_strings_coerced_to_none():
    raw = {
        "description": "Fix bug",
        "assignee": "   ",
        "due_date": "   ",
        "context": "   ",
    }
    item = validate_action_item_dict(raw)
    assert item.assignee is None
    assert item.due_date is None
    assert item.context is None


def test_validate_action_item_dict_invalid_non_dict():
    with pytest.raises(ValidationError, match="Action item must be a dictionary"):
        validate_action_item_dict("not a dict")


def test_validate_action_item_dict_missing_or_empty_description():
    with pytest.raises(ValidationError, match="Action item description is required"):
        validate_action_item_dict({})

    with pytest.raises(ValidationError, match="Action item description is required"):
        validate_action_item_dict({"description": ""})

    with pytest.raises(ValidationError, match="Action item description is required"):
        validate_action_item_dict({"description": "   "})

    with pytest.raises(ValidationError, match="Action item description is required"):
        validate_action_item_dict({"description": 123})


def test_validate_action_item_dict_invalid_types():
    with pytest.raises(ValidationError, match="Assignee must be a string or None"):
        validate_action_item_dict({"description": "task", "assignee": 123})

    with pytest.raises(ValidationError, match="due_date must be a string or None"):
        validate_action_item_dict({"description": "task", "due_date": 123})

    with pytest.raises(ValidationError, match="Priority must be a string"):
        validate_action_item_dict({"description": "task", "priority": 123})

    with pytest.raises(ValidationError, match="Invalid priority 'urgent'"):
        validate_action_item_dict({"description": "task", "priority": "urgent"})

    with pytest.raises(ValidationError, match="Status must be a string"):
        validate_action_item_dict({"description": "task", "status": 123})

    with pytest.raises(ValidationError, match="Invalid status 'unknown'"):
        validate_action_item_dict({"description": "task", "status": "unknown"})

    with pytest.raises(ValidationError, match="Context must be a string or None"):
        validate_action_item_dict({"description": "task", "context": 123})


def test_validate_extraction_dict_valid():
    raw = {
        "meeting_title": "  Team Standup  ",
        "summary": "  Quick alignment  ",
        "action_items": [
            {"description": "Task 1"},
            {"description": "Task 2", "assignee": "Charlie"},
        ],
    }
    res = validate_extraction_dict(raw)
    assert res.meeting_title == "Team Standup"
    assert res.summary == "Quick alignment"
    assert len(res.action_items) == 2
    assert res.action_items[0].description == "Task 1"
    assert res.action_items[1].assignee == "Charlie"


def test_validate_extraction_dict_empty_strings_and_defaults():
    raw = {
        "meeting_title": "   ",
        "summary": "   ",
        "action_items": None,
    }
    res = validate_extraction_dict(raw)
    assert res.meeting_title is None
    assert res.summary is None
    assert res.action_items == []


def test_validate_extraction_dict_invalid_inputs():
    with pytest.raises(ValidationError, match="Extraction result must be a dictionary"):
        validate_extraction_dict(["not a dict"])

    with pytest.raises(ValidationError, match="meeting_title must be a string or None"):
        validate_extraction_dict({"meeting_title": 123})

    with pytest.raises(ValidationError, match="summary must be a string or None"):
        validate_extraction_dict({"summary": 123})

    with pytest.raises(ValidationError, match="action_items must be a list"):
        validate_extraction_dict({"action_items": "not a list"})
