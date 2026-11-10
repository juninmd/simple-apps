import pytest
from extract_acts.prompt_builder import PromptBuilder, SYSTEM_PROMPT


def test_prompt_builder_init_defaults():
    builder = PromptBuilder()
    assert builder.system_prompt == SYSTEM_PROMPT
    assert builder.include_context is True
    assert builder.default_priority == "medium"


def test_prompt_builder_custom_init():
    builder = PromptBuilder(
        system_prompt="Custom system instructions",
        include_context=False,
        default_priority="low",
    )
    assert builder.system_prompt == "Custom system instructions"
    assert builder.include_context is False
    assert builder.default_priority == "low"


def test_build_user_prompt_empty_transcript_raises():
    builder = PromptBuilder()
    with pytest.raises(ValueError, match="Transcript cannot be empty"):
        builder.build_user_prompt("")

    with pytest.raises(ValueError, match="Transcript cannot be empty"):
        builder.build_user_prompt("   \n  \t ")


def test_build_user_prompt_minimal():
    builder = PromptBuilder()
    prompt = builder.build_user_prompt("Alice: I will prepare the presentation.")
    assert "Meeting Transcript:" in prompt
    assert "Alice: I will prepare the presentation." in prompt
    assert "Extract the action items following the schema instructions." in prompt
    assert "Meeting Participants:" not in prompt
    assert "Additional Instructions:" not in prompt


def test_build_user_prompt_with_participants_and_instructions():
    builder = PromptBuilder()
    prompt = builder.build_user_prompt(
        transcript="Bob: I'll update the ticket.",
        additional_instructions="Ignore casual remarks.",
        participants=["Alice", "Bob", "", "   "],
    )
    assert "Meeting Participants: Alice, Bob" in prompt
    assert "Additional Instructions:\nIgnore casual remarks." in prompt
    assert "Bob: I'll update the ticket." in prompt


def test_build_messages():
    builder = PromptBuilder()
    messages = builder.build_messages(
        transcript="Charlie: I will deploy by Friday.",
        participants=["Charlie"],
    )
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == SYSTEM_PROMPT
    assert messages[1]["role"] == "user"
    assert "Charlie: I will deploy by Friday." in messages[1]["content"]
    assert "Meeting Participants: Charlie" in messages[1]["content"]
