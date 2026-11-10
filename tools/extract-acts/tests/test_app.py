"""Integration tests for ChecklistApp."""

from __future__ import annotations

import pytest

from extract_acts.app import ChecklistApp


@pytest.mark.asyncio
async def test_checklist_app_theme_light_mode() -> None:
    app = ChecklistApp(mode="light")
    async with app.run_test():
        assert app.theme == "textual-light"
        assert app.current_theme.dark is False


@pytest.mark.asyncio
async def test_checklist_app_theme_dark_mode() -> None:
    app = ChecklistApp(mode="dark")
    async with app.run_test():
        assert app.theme == "textual-dark"
        assert app.current_theme.dark is True


@pytest.mark.asyncio
async def test_checklist_app_toggle_theme() -> None:
    app = ChecklistApp(mode="dark")
    async with app.run_test() as pilot:
        assert app.theme == "textual-dark"
        await pilot.press("t")
        assert app.theme == "textual-light"
        assert app.current_theme.dark is False
        await pilot.press("t")
        assert app.theme == "textual-dark"
        assert app.current_theme.dark is True


@pytest.mark.asyncio
async def test_checklist_app_renders_markdown_content() -> None:
    custom_md = "# Project Alpha\n- [ ] Task 1\n- [x] Task 2"
    app = ChecklistApp(markdown_content=custom_md, mode="light")
    async with app.run_test():
        assert app.markdown_content == custom_md
