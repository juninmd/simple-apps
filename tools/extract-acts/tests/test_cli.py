"""Integration tests for CLI entry point."""

from __future__ import annotations

from pathlib import Path

import pytest

from extract_acts.cli import main


def test_cli_list_prompts(
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "custom_retro.j2").write_text("Retro template", encoding="utf-8")

    monkeypatch.setenv("EXTRACTACTS_PROMPTS_DIR", str(prompts_dir))

    exit_code = main(["--list-prompts"])
    assert exit_code == 0

    captured = capsys.readouterr()
    assert "default" in captured.out
    assert "standup" in captured.out
    assert "one_on_one" in captured.out
    assert "custom_retro" in captured.out


def test_cli_render_prompt_with_transcript_file(
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "sprint_demo.j2").write_text(
        "Sprint demo extraction:\nTranscript:\n{{ transcript }}",
        encoding="utf-8",
    )
    monkeypatch.setenv("EXTRACTACTS_PROMPTS_DIR", str(prompts_dir))

    transcript_file = tmp_path / "meeting.txt"
    transcript_file.write_text("Bob presented the new login page.", encoding="utf-8")

    exit_code = main(["--prompt", "sprint_demo", "--file", str(transcript_file)])
    assert exit_code == 0

    captured = capsys.readouterr()
    assert "Sprint demo extraction:" in captured.out
    assert "Bob presented the new login page." in captured.out


def test_cli_render_default_prompt(
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
) -> None:
    transcript_file = tmp_path / "meeting.txt"
    transcript_file.write_text("Meeting discussion notes.", encoding="utf-8")

    exit_code = main(["--file", str(transcript_file)])
    assert exit_code == 0

    captured = capsys.readouterr()
    assert "Meeting discussion notes." in captured.out


def test_cli_prompt_not_found_returns_error(
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
) -> None:
    transcript_file = tmp_path / "meeting.txt"
    transcript_file.write_text("Transcript", encoding="utf-8")

    exit_code = main(["--prompt", "unknown_type", "--file", str(transcript_file)])
    assert exit_code != 0

    captured = capsys.readouterr()
    assert "Prompt template 'unknown_type' not found" in captured.err


def test_cli_detect_theme(capsys) -> None:
    code = main(["--detect-theme"])
    assert code == 0
    captured = capsys.readouterr()
    assert captured.out.strip() in ("dark", "light")


def test_cli_file_not_found(capsys, tmp_path: Path) -> None:
    non_existent = tmp_path / "does_not_exist.md"
    code = main(["--file", str(non_existent)])
    assert code == 2
    captured = capsys.readouterr()
    assert "Error: file not found" in captured.err


def test_cli_processes_input_string(capsys):
    input_text = "Alice: I will fix the bug.\nBob: I will check the logs."
    exit_code = main(["--text", input_text])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "- [ ] Alice: fix the bug" in captured.out
    assert "- [ ] Bob: check the logs" in captured.out


def test_cli_processes_unlabeled_transcript(capsys):
    input_text = "Hi, this is Dave.\nI will deploy the new release tomorrow.\n"
    exit_code = main(["--text", input_text])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "- [ ] Dave: deploy the new release tomorrow" in captured.out
