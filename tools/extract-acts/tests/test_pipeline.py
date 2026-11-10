import pytest
from extract_acts.pipeline import ExtractionPipeline
from extract_acts.prompt_builder import PromptBuilder
from extract_acts.response_parser import ResponseParser


def test_pipeline_no_llm_caller_raises():
    pipeline = ExtractionPipeline()
    with pytest.raises(ValueError, match="No LLM caller provided"):
        pipeline.extract("Transcript text")


def test_pipeline_extract_with_instance_caller():
    def mock_llm(messages):
        assert len(messages) == 2
        assert "Alice: I will fix the bug" in messages[1]["content"]
        return '{"meeting_title": "Bug Triage", "action_items": [{"description": "Fix the bug", "assignee": "Alice"}]}'

    pipeline = ExtractionPipeline(llm_caller=mock_llm)
    result = pipeline.extract("Alice: I will fix the bug")

    assert result.meeting_title == "Bug Triage"
    assert len(result.action_items) == 1
    assert result.action_items[0].description == "Fix the bug"
    assert result.action_items[0].assignee == "Alice"


def test_pipeline_extract_with_passed_caller_override():
    def default_caller(messages):
        raise AssertionError("Default caller should not be called")

    def override_caller(messages):
        assert "Additional Instructions:\nFocus on DevOps" in messages[1]["content"]
        assert "Meeting Participants: Bob" in messages[1]["content"]
        return '{"action_items": [{"description": "Configure CI pipeline", "assignee": "Bob"}]}'

    pipeline = ExtractionPipeline(llm_caller=default_caller)
    result = pipeline.extract(
        transcript="Bob: I'll setup GitHub actions.",
        additional_instructions="Focus on DevOps",
        participants=["Bob"],
        llm_caller=override_caller,
    )

    assert len(result.action_items) == 1
    assert result.action_items[0].description == "Configure CI pipeline"
    assert result.action_items[0].assignee == "Bob"


def test_pipeline_with_custom_prompt_builder_and_parser():
    custom_builder = PromptBuilder(default_priority="high")
    custom_parser = ResponseParser(allow_partial=True)
    pipeline = ExtractionPipeline(
        prompt_builder=custom_builder,
        response_parser=custom_parser,
    )

    def mock_caller(messages):
        # Return invalid item along with valid item
        return '{"action_items": [{"description": "Valid task"}, {"description": ""}]}'

    result = pipeline.extract("Team sync", llm_caller=mock_caller)
    assert len(result.action_items) == 1
    assert result.action_items[0].description == "Valid task"
