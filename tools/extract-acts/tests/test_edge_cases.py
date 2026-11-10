from extract_acts.cli import run_cli
from extract_acts.diarizer import diarize_transcript
from extract_acts.extractor import extract_action_items


def test_empty_transcript():
    assert diarize_transcript("") == []
    assert extract_action_items("") == []


def test_transcript_no_actions():
    raw = "Alice: The weather is nice today.\nBob: Indeed it is."
    assert extract_action_items(raw) == []


def test_file_input(tmp_path, capsys):
    sample_file = tmp_path / "meeting.txt"
    sample_file.write_text(
        "Hi, this is Grace.\nI will coordinate the client demo.\n",
        encoding="utf-8",
    )
    code = run_cli([str(sample_file)])
    assert code == 0
    captured = capsys.readouterr()
    assert "- [ ] Grace: coordinate the client demo" in captured.out


def test_missing_file(capsys):
    code = run_cli(["nonexistent_file_12345.txt"])
    assert code == 1
    captured = capsys.readouterr()
    assert "Error reading file" in captured.err
