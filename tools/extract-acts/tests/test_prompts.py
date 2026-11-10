from __future__ import annotations

from pathlib import Path

import pytest

from extractacts.prompts import (
    PromptManager,
    PromptTemplateNotFoundError,
    PromptTemplateSyntaxError,
)


def test_builtin_templates_available() -> None:
    manager = PromptManager(user_prompts_dir=Path("/nonexistent/directory"))
    templates = manager.list_templates()
    assert "default" in templates
    assert "standup" in templates
    assert "one_on_one" in templates


def test_discover_custom_templates_in_directory(tmp_path: Path) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()

    # Create custom prompt files
    (prompts_dir / "retro.j2").write_text(
        "Extract retro items from transcript:\n{{ transcript }}",
        encoding="utf-8",
    )
    (prompts_dir / "planning.jinja2").write_text(
        "Sprint planning tasks:\n{{ transcript }}",
        encoding="utf-8",
    )
    (prompts_dir / "review.jinja").write_text(
        "Sprint review acts:\n{{ transcript }}",
        encoding="utf-8",
    )
    (prompts_dir / "incident.txt").write_text(
        "Incident postmortem action items:\n{{ transcript }}",
        encoding="utf-8",
    )
    # Ignore non-template files
    (prompts_dir / "notes.md").write_text("Ignore me", encoding="utf-8")

    manager = PromptManager(user_prompts_dir=prompts_dir)
    templates = manager.list_templates()

    assert "retro" in templates
    assert "planning" in templates
    assert "review" in templates
    assert "incident" in templates
    assert "notes" not in templates


def test_custom_template_overrides_builtin(tmp_path: Path) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "standup.j2").write_text(
        "Custom standup template for {{ team }}:\n{{ transcript }}",
        encoding="utf-8",
    )

    manager = PromptManager(user_prompts_dir=prompts_dir)
    rendered = manager.render("standup", transcript="Worked on bug fixes", team="Core")

    assert "Custom standup template for Core:" in rendered
    assert "Worked on bug fixes" in rendered


def test_render_builtin_template() -> None:
    manager = PromptManager(user_prompts_dir=Path("/nonexistent/directory"))
    rendered = manager.render("default", transcript="Alice will submit PR tomorrow")
    assert "Alice will submit PR tomorrow" in rendered
    assert "Action Items" in rendered or "task" in rendered.lower()


def test_render_template_with_custom_context(tmp_path: Path) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    custom_content = (
        "Meeting with {{ client }} on {{ date }}:\n"
        "Transcript:\n{{ transcript }}\nFocus: {{ focus }}"
    )
    (prompts_dir / "client_sync.j2").write_text(
        custom_content,
        encoding="utf-8",
    )

    manager = PromptManager(user_prompts_dir=prompts_dir)
    rendered = manager.render(
        "client_sync",
        transcript="Discussed delivery milestones",
        client="Acme Corp",
        date="2026-11-05",
        focus="Milestone 1",
    )

    assert "Meeting with Acme Corp on 2026-11-05:" in rendered
    assert "Transcript:\nDiscussed delivery milestones" in rendered
    assert "Focus: Milestone 1" in rendered


def test_default_prompts_directory_path() -> None:
    manager = PromptManager()
    assert manager.user_prompts_dir == Path.home() / ".extractacts" / "prompts"


def test_template_not_found_raises_error(tmp_path: Path) -> None:
    manager = PromptManager(user_prompts_dir=tmp_path)
    with pytest.raises(PromptTemplateNotFoundError) as exc_info:
        manager.render("nonexistent_template", transcript="hello")
    assert "nonexistent_template" in str(exc_info.value)


def test_template_syntax_error_raises_error(tmp_path: Path) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "broken.j2").write_text(
        "Broken template: {% if transcript %}{{ transcript }}",  # missing endif
        encoding="utf-8",
    )

    manager = PromptManager(user_prompts_dir=prompts_dir)
    with pytest.raises(PromptTemplateSyntaxError):
        manager.render("broken", transcript="foo")


def test_get_template_source(tmp_path: Path) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "custom.j2").write_text("Hello {{ transcript }}", encoding="utf-8")

    manager = PromptManager(user_prompts_dir=prompts_dir)
    source, is_custom = manager.get_template_source("custom")
    assert source == "Hello {{ transcript }}"
    assert is_custom is True

    builtin_source, is_builtin_custom = manager.get_template_source("default")
    assert "{{ transcript }}" in builtin_source
    assert is_builtin_custom is False
