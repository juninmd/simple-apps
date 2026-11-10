"""Prompt management and Jinja2-style template plugin system for extractacts."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import jinja2

DEFAULT_PROMPTS_DIR = Path.home() / ".extractacts" / "prompts"

SUPPORTED_EXTENSIONS = (".j2", ".jinja", ".jinja2", ".txt")

BUILTIN_TEMPLATES: dict[str, str] = {
    "default": """You are an expert executive assistant and project manager.
Analyze the following meeting transcript and extract actionable tasks and commitments.

Requirements:
- Identify action items, assignees, deadlines, and dependencies.
- Output each task as a markdown checklist item:
  `- [ ] **[Assignee]** Task description (due: date/context)`.
- If no assignee is mentioned, use `[Unassigned]`.
- Be concise, clear, and ensure no implicit agreement or follow-up is missed.

Transcript:
{{ transcript }}
""",
    "standup": """You are assisting an agile development team in tracking daily standups.
Extract the key progress updates, upcoming tasks, and blockers from this standup transcript.

Format:
### Done / Updates
- [item]

### Next / Action Items
- [ ] **[Assignee]** Task (due date if applicable)

### Blockers / Impairments
- [issue]

Transcript:
{{ transcript }}
""",
    "one_on_one": """You are facilitating a 1-on-1 meeting follow-up.
Extract action items, agreed goals, feedback topics, and next steps from this 1-on-1 transcript.

Format:
### Agreed Actions & Next Steps
- [ ] **[Assignee]** Task / Commitment

### Discussion Points & Feedback
- Key notes

### Follow-up Topics for Next Session
- Topic

Transcript:
{{ transcript }}
""",
}


class PromptTemplateError(Exception):
    """Base exception for prompt template operations."""


class PromptTemplateNotFoundError(PromptTemplateError):
    """Raised when a requested prompt template cannot be found."""


class PromptTemplateSyntaxError(PromptTemplateError):
    """Raised when a prompt template has syntax errors during compilation or rendering."""


class PromptManager:
    """Manages built-in prompt templates and custom user prompt plugins."""

    def __init__(self, user_prompts_dir: Path | str | None = None) -> None:
        if user_prompts_dir is None:
            self.user_prompts_dir = DEFAULT_PROMPTS_DIR
        else:
            self.user_prompts_dir = Path(user_prompts_dir).expanduser().resolve()

        self._jinja_env = jinja2.Environment(
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True,
            undefined=jinja2.StrictUndefined,
        )

    def _discover_user_templates(self) -> dict[str, Path]:
        """Discovers custom templates in the user prompts directory."""
        custom_templates: dict[str, Path] = {}
        if not self.user_prompts_dir.is_dir():
            return custom_templates

        for entry in sorted(self.user_prompts_dir.iterdir()):
            if entry.is_file() and entry.suffix.lower() in SUPPORTED_EXTENSIONS:
                template_name = entry.stem
                if template_name not in custom_templates:
                    custom_templates[template_name] = entry

        return custom_templates

    def list_templates(self) -> list[str]:
        """Returns a sorted list of all available prompt template names (built-in and custom)."""
        names = set(BUILTIN_TEMPLATES.keys())
        names.update(self._discover_user_templates().keys())
        return sorted(names)

    def get_template_source(self, template_name: str) -> tuple[str, bool]:
        """Returns (template_source, is_custom) for a given template name."""
        user_templates = self._discover_user_templates()
        if template_name in user_templates:
            filepath = user_templates[template_name]
            try:
                return filepath.read_text(encoding="utf-8"), True
            except OSError as err:
                msg = (
                    f"Failed to read custom prompt template '{template_name}' "
                    f"from {filepath}: {err}"
                )
                raise PromptTemplateError(msg) from err

        if template_name in BUILTIN_TEMPLATES:
            return BUILTIN_TEMPLATES[template_name], False

        available = ", ".join(self.list_templates())
        raise PromptTemplateNotFoundError(
            f"Prompt template '{template_name}' not found. Available templates: {available}"
        )

    def render(self, template_name: str, **context: Any) -> str:
        """Renders the specified prompt template using Jinja2 with the given context variables."""
        source, _ = self.get_template_source(template_name)
        try:
            template = self._jinja_env.from_string(source)
            return template.render(**context)
        except (jinja2.TemplateSyntaxError, jinja2.UndefinedError) as err:
            raise PromptTemplateSyntaxError(
                f"Error in prompt template '{template_name}': {err}"
            ) from err
