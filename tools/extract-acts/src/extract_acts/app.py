"""Extract-Acts: Turn meeting transcripts into checkable task lists.

Propose calendar entries via Google Calendar API with a single key-press.
"""

from __future__ import annotations

import argparse
import sys
from typing import List, Optional

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.widgets import Button, Footer, Header, ListView, TextArea

from extract_acts.calendar_service import GoogleCalendarService
from extract_acts.extractor import extract_action_items
from extract_acts.models import ActionItem, CalendarStatus
from extract_acts.ui import StatusBanner, TaskItemWidget

DEFAULT_SAMPLE_TRANSCRIPT = """Alice: Hi everyone, let's review the release tasks.
Bob: I will finalize the documentation by 2026-11-10.
Alice: Great, @charlie please deploy the staging environment by 2026-11-12.
Charlie: Sure thing. Also, we need to send announcement email tomorrow.
Bob: Don't forget, prepare retrospective deck by Friday.
"""


class ExtractActsApp(App):
    """Textual TUI for Extract-Acts with calendar event proposals."""

    CSS = """
    Screen {
        layout: vertical;
    }
    #main-container {
        height: 1fr;
    }
    #left-pane {
        width: 1fr;
        border-right: solid $accent;
        padding: 1;
    }
    #right-pane {
        width: 1fr;
        padding: 1;
    }
    TextArea {
        height: 1fr;
        margin-bottom: 1;
    }
    ListView {
        height: 1fr;
        border: solid $primary;
        margin-bottom: 1;
    }
    .task-row {
        height: auto;
        padding: 0 1;
    }
    .task-details {
        width: 1fr;
        margin-left: 1;
    }
    .task-desc {
        text-style: bold;
    }
    .task-meta {
        color: $text-muted;
    }
    #status-banner {
        height: 3;
        dock: bottom;
        background: $panel;
        padding: 1;
        text-align: center;
        color: $text;
    }
    #status-banner.success {
        background: $success;
        color: $text;
    }
    #status-banner.error {
        background: $error;
        color: $text;
    }
    #status-banner.warning {
        background: $warning;
        color: $text;
    }
    """

    BINDINGS = [
        Binding("c", "propose_calendar", "Propose Calendar Entry", priority=False),
        Binding("ctrl+c", "propose_calendar", "Propose Calendar Entry (Ctrl+C)", priority=True),
        Binding("e", "extract_tasks", "Extract Tasks", priority=False),
        Binding("ctrl+e", "extract_tasks", "Extract Tasks (Ctrl+E)", priority=True),
        Binding("ctrl+q", "quit", "Quit", priority=True),
    ]

    def __init__(
        self,
        transcript: str = DEFAULT_SAMPLE_TRANSCRIPT,
        calendar_service: Optional[GoogleCalendarService] = None,
    ) -> None:
        super().__init__()
        self.initial_transcript = transcript
        self.calendar_service = calendar_service or GoogleCalendarService()
        self.items: List[ActionItem] = []

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Horizontal(id="main-container"):
            with Vertical(id="left-pane"):
                yield TextArea(self.initial_transcript, id="transcript-input")
                yield Button("Extract Tasks (e)", id="btn-extract", variant="primary")
            with Vertical(id="right-pane"):
                yield ListView(id="task-list")
                with Horizontal():
                    yield Button("Propose Calendar Entry (c)", id="btn-calendar", variant="success")
        yield StatusBanner(
            "Ready. Press 'e' to extract, 'c' to propose calendar entry for selected task.",
            id="status-banner",
        )
        yield Footer()

    def on_mount(self) -> None:
        """Automatically perform initial extraction on startup."""
        self.action_extract_tasks()

    def action_extract_tasks(self) -> None:
        """Extract tasks from transcript textarea."""
        input_widget = self.query_one("#transcript-input", TextArea)
        transcript_text = input_widget.text
        self.items = extract_action_items(transcript_text)

        task_list = self.query_one("#task-list", ListView)
        task_list.clear()

        for item in self.items:
            task_list.append(TaskItemWidget(item))

        if self.items:
            task_list.index = 0

        banner = self.query_one("#status-banner", StatusBanner)
        if self.items:
            banner.show_message(
                f"Extracted {len(self.items)} action items. "
                "Select an item and press 'c' to propose to Google Calendar.",
                level="info",
            )
        else:
            banner.show_message(
                "No action items found in transcript. Try adding lines with 'by <date>' or TODO.",
                level="warning",
            )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-extract":
            self.action_extract_tasks()
        elif event.button.id == "btn-calendar":
            self.action_propose_calendar()

    def action_propose_calendar(self) -> None:
        """Propose calendar entry for the currently highlighted task with key 'c'."""
        task_list = self.query_one("#task-list", ListView)
        banner = self.query_one("#status-banner", StatusBanner)

        if not task_list.children:
            banner.show_message("No tasks available to propose.", level="warning")
            return

        highlighted = task_list.highlighted_child
        if not highlighted or not isinstance(highlighted, TaskItemWidget):
            banner.show_message("Please select a task from the list first.", level="warning")
            return

        item = highlighted.item
        if not item.due_date:
            banner.show_message(
                f"Cannot propose to calendar: Task '{item.description}' "
                "has no identified due date.",
                level="warning",
            )
            return

        # Call Calendar API Service
        updated_item = self.calendar_service.propose_calendar_entry(item)
        highlighted.update_view()

        if updated_item.calendar_status in (CalendarStatus.CREATED, CalendarStatus.PROPOSED):
            event_id = item.calendar_event_id or "proposed"
            banner.show_message(
                f"Success! Calendar entry proposed for '{item.description}' "
                f"on {item.due_date} (ID: {event_id})",
                level="success",
            )
        else:
            banner.show_message(
                f"Calendar proposal failed: {updated_item.calendar_error}",
                level="error",
            )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract-Acts: Meeting transcript task & calendar manager"
    )
    parser.add_argument("--file", "-f", help="Path to transcript file to load")
    parser.add_argument(
        "--dry-run", action="store_true", help="Propose calendar entries in dry-run mode"
    )
    args = parser.parse_args()

    transcript = DEFAULT_SAMPLE_TRANSCRIPT
    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                transcript = f.read()
        except Exception as exc:
            print(f"Error reading transcript file: {exc}", file=sys.stderr)
            sys.exit(1)

    cal_service = GoogleCalendarService(dry_run=args.dry_run)
    app = ExtractActsApp(transcript=transcript, calendar_service=cal_service)
    app.run()


if __name__ == "__main__":
    main()
