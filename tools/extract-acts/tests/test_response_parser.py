import pytest
from extract_acts.response_parser import ResponseParser, ParseError, extract_json_payload
from extract_acts.schema import Priority, Status


def test_extract_json_payload_empty():
    with pytest.raises(ParseError, match="Response text is empty"):
        extract_json_payload("")

    with pytest.raises(ParseError, match="Response text is empty"):
        extract_json_payload("   \n\t  ")


def test_extract_json_payload_markdown_code_fence():
    raw = """Here is the result:
```json
{
  "meeting_title": "Project Sync",
  "action_items": []
}
```
Hope that helps!"""
    extracted = extract_json_payload(raw)
    assert extracted == '{\n  "meeting_title": "Project Sync",\n  "action_items": []\n}'


def test_extract_json_payload_markdown_code_fence_no_json_tag():
    raw = """```
{"meeting_title": "Project Sync", "action_items": []}
```"""
    extracted = extract_json_payload(raw)
    assert extracted == '{"meeting_title": "Project Sync", "action_items": []}'


def test_extract_json_payload_embedded_in_text():
    raw = 'Sure, here is your JSON: {"meeting_title": "Project Sync", "action_items": []} Thanks!'
    extracted = extract_json_payload(raw)
    assert extracted == '{"meeting_title": "Project Sync", "action_items": []}'


def test_response_parser_valid_full():
    parser = ResponseParser()
    raw = """{
      "meeting_title": "Sprint 10 Planning",
      "summary": "Reviewed backlog and picked sprint goals.",
      "action_items": [
        {
          "description": "Create db migrations",
          "assignee": "Dave",
          "due_date": "2026-11-20",
          "priority": "high",
          "status": "todo",
          "context": "Needs review from team lead"
        }
      ]
    }"""
    result = parser.parse(raw)
    assert result.meeting_title == "Sprint 10 Planning"
    assert result.summary == "Reviewed backlog and picked sprint goals."
    assert len(result.action_items) == 1
    assert result.action_items[0].description == "Create db migrations"
    assert result.action_items[0].assignee == "Dave"
    assert result.action_items[0].priority == Priority.HIGH
    assert result.action_items[0].status == Status.TODO


def test_response_parser_bare_list():
    parser = ResponseParser()
    raw = """[
      {"description": "Task A"},
      {"description": "Task B"}
    ]"""
    result = parser.parse(raw)
    assert result.meeting_title is None
    assert len(result.action_items) == 2
    assert result.action_items[0].description == "Task A"
    assert result.action_items[1].description == "Task B"


def test_response_parser_invalid_json():
    parser = ResponseParser()
    with pytest.raises(ParseError, match="Failed to decode JSON"):
        parser.parse("{bad json: 123")


def test_response_parser_validation_failure_strict():
    parser = ResponseParser(allow_partial=False)
    raw = '{"meeting_title": "Test", "action_items": [{"description": ""}]}'
    with pytest.raises(ParseError, match="Schema validation failed"):
        parser.parse(raw)


def test_response_parser_partial_salvage():
    parser = ResponseParser(allow_partial=True)
    raw = """{
      "meeting_title": "Partial Meeting",
      "summary": "Some notes",
      "action_items": [
        {"description": "Valid task 1", "assignee": "Alice"},
        {"description": ""},
        {"description": "Valid task 2", "priority": "critical"},
        "not a dict"
      ]
    }"""
    result = parser.parse(raw)
    assert result.meeting_title == "Partial Meeting"
    assert result.summary == "Some notes"
    assert len(result.action_items) == 2
    assert result.action_items[0].description == "Valid task 1"
    assert result.action_items[1].description == "Valid task 2"
    assert result.action_items[1].priority == Priority.CRITICAL


def test_response_parser_partial_salvage_invalid_top_level_fields():
    parser = ResponseParser(allow_partial=True)
    raw = """{
      "meeting_title": 123,
      "summary": 456,
      "action_items": "not a list"
    }"""
    result = parser.parse(raw)
    assert result.meeting_title is None
    assert result.summary is None
    assert result.action_items == []
