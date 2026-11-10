"""Checklist Textual application with terminal theme auto-detection."""

from __future__ import annotations

from typing import ClassVar

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.widgets import Footer, Header, MarkdownViewer

from extract_acts.theme import get_theme_for_mode

DEFAULT_CHECKLIST_MD = """# Meeting Checklist

Turn meeting transcripts into checkable task lists without leaving the terminal.

## Tasks
- [ ] Review meeting notes and decisions
- [ ] Confirm task assignees and due dates
- [ ] Share action item checklist with the team
"""


class ChecklistApp(App[None]):
    """Textual app rendering an action item checklist in Markdown."""

    TITLE = "extract-acts"
    SUB_TITLE = "Meeting Checklist"

    BINDINGS: ClassVar[list[Binding]] = [
        Binding("q", "quit", "Quit"),
        Binding("t", "toggle_theme", "Toggle Theme"),
    ]

    CSS = """
    Screen {
        background: $background;
        color: $foreground;
    }

    MarkdownViewer {
        height: 100%;
        padding: 1 2;
        background: $background;
        color: $foreground;
    }
    """

    def __init__(
        self,
        markdown_content: str = DEFAULT_CHECKLIST_MD,
        mode: str | None = "auto",
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        self.markdown_content = markdown_content
        self.requested_mode = mode

    def on_mount(self) -> None:
        """Apply the auto-detected or specified theme on mount."""
        self.theme = get_theme_for_mode(self.requested_mode)

    def action_toggle_theme(self) -> None:
        """Toggle between dark and light themes for terminal legibility."""
        if self.current_theme.dark:
            self.theme = "textual-light"
        else:
            self.theme = "textual-dark"

    def compose(self) -> ComposeResult:
        yield Header()
        yield MarkdownViewer(self.markdown_content, show_table_of_contents=False)
        yield Footer()
