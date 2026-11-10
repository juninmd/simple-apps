"""Textual UI widgets and components for extract-acts."""

from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import Checkbox, Label, ListItem, Static

from extract_acts.models import ActionItem, CalendarStatus


class TaskItemWidget(ListItem):
    """Custom ListItem widget representing an ActionItem."""

    def __init__(self, item: ActionItem) -> None:
        super().__init__()
        self.item = item

    def compose(self) -> ComposeResult:
        with Horizontal(classes="task-row"):
            yield Checkbox(value=self.item.completed, id=f"chk-{self.item.id}")
            with Vertical(classes="task-details"):
                desc_text = self.item.description
                if self.item.assignee:
                    desc_text += f" (@{self.item.assignee})"
                yield Label(desc_text, classes="task-desc")

                due_text = (
                    f"📅 Due: {self.item.due_date}" if self.item.due_date else "📅 No due date"
                )
                status_text = self._format_calendar_status()
                yield Label(
                    f"{due_text} | {status_text}", id=f"meta-{self.item.id}", classes="task-meta"
                )

    def _format_calendar_status(self) -> str:
        if self.item.calendar_status == CalendarStatus.CREATED:
            return f"🟢 Calendar: Added ({self.item.calendar_event_id})"
        elif self.item.calendar_status == CalendarStatus.PROPOSED:
            return "🟡 Calendar: Proposed"
        elif self.item.calendar_status == CalendarStatus.FAILED:
            return f"🔴 Calendar Error: {self.item.calendar_error}"
        return "⚪ Calendar: Not added (Press 'c' to propose)"

    def update_view(self) -> None:
        """Refresh metadata label after state changes."""
        meta_label = self.query_one(f"#meta-{self.item.id}", Label)
        due_text = f"📅 Due: {self.item.due_date}" if self.item.due_date else "📅 No due date"
        status_text = self._format_calendar_status()
        meta_label.update(f"{due_text} | {status_text}")


class StatusBanner(Static):
    """Notification and status banner widget."""

    def __init__(self, renderable: str = "", id: str | None = None) -> None:
        super().__init__(renderable, id=id)
        self.message: str = renderable

    def show_message(self, message: str, level: str = "info") -> None:
        self.message = message
        self.remove_class("info", "success", "error", "warning")
        self.add_class(level)
        self.update(message)
