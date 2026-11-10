"""Lightweight speaker diarization module."""

import re
from dataclasses import dataclass

from extract_acts.common_words import NON_NAME_WORDS


@dataclass
class Utterance:
    speaker: str
    text: str
    timestamp: str | None = None


TIMESTAMP_REGEX = re.compile(
    r"^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]|\((\d{1,2}:\d{2}(?::\d{2})?)\))\s*"
)
LABEL_REGEX = re.compile(r"^([A-Z][a-zA-Z0-9_\- ]{1,30}?)\s*:\s*(.*)$")

# Require "speaking" or "here" for "i am / i'm", or allow "this is <Name>"
SELF_INTRO_REGEX = re.compile(
    r"(?:^|\b)(?:this is\s+([A-Z][a-zA-Z0-9_]+)(?:\s+speaking|\s+here)?|(?:i am|i'm)\s+([A-Z][a-zA-Z0-9_]+)\s+(?:speaking|here))\b",
    re.IGNORECASE,
)
HERE_INTRO_REGEX = re.compile(
    r"\b([A-Z][a-zA-Z0-9_]+)\s+here\b",
    re.IGNORECASE,
)
VOCATIVE_REGEX = re.compile(
    r"^([A-Z][a-zA-Z0-9_]+)\s*,\s*(?:can|could|would|will|please)\b",
    re.IGNORECASE,
)
# Acknowledgment words that indicate turn handover to another speaker in dialogue
RESPONSE_ACKNOWLEDGMENT_REGEX = re.compile(
    r"^(?:sounds good|great|awesome|sure|thanks(?:\s+everyone|\s+all)?|okay|ok|got it|cool)(?:[,.!]|\s+let'?s|\s+i\b|$)",
    re.IGNORECASE,
)


def _parse_timestamp(line: str) -> tuple[str | None, str]:
    match = TIMESTAMP_REGEX.match(line)
    if match:
        ts = match.group(1) or match.group(2)
        cleaned_line = line[match.end() :].strip()
        return ts, cleaned_line
    return None, line


def _parse_explicit_label(line: str) -> tuple[str | None, str]:
    match = LABEL_REGEX.match(line)
    if match:
        speaker = match.group(1).strip()
        text = match.group(2).strip()
        return speaker, text
    return None, line


def _infer_speaker_from_content(text: str) -> str | None:
    match = SELF_INTRO_REGEX.search(text)
    if match:
        raw_name = match.group(1) or match.group(2)
        if raw_name:
            name = raw_name.capitalize()
            if name.lower() not in NON_NAME_WORDS:
                return name

    match = HERE_INTRO_REGEX.search(text)
    if match:
        name = match.group(1).capitalize()
        if name.lower() not in NON_NAME_WORDS:
            return name

    return None


def _detect_vocative_target(text: str) -> str | None:
    match = VOCATIVE_REGEX.search(text)
    if match:
        name = match.group(1).capitalize()
        if name.lower() not in NON_NAME_WORDS:
            return name
    return None


def diarize_transcript(raw_transcript: str) -> list[Utterance]:
    """Diarizes a meeting transcript into utterances attributed to speakers.

    Handles explicit speaker labels as well as unlabeled transcripts using turn
    segmentation, timestamp cues, vocatives, and self-introductions.
    """
    if not raw_transcript or not raw_transcript.strip():
        return []

    lines = raw_transcript.splitlines()

    # Step 1: Check if transcript uses explicit speaker labels (e.g. "Alice: ...")
    explicit_count = 0
    non_empty_count = 0
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        non_empty_count += 1
        _, text_without_ts = _parse_timestamp(cleaned)
        spk, _ = _parse_explicit_label(text_without_ts)
        if spk:
            explicit_count += 1

    has_predominant_explicit_labels = (
        non_empty_count > 0 and (explicit_count / non_empty_count) >= 0.4
    )

    if has_predominant_explicit_labels:
        utterances: list[Utterance] = []
        current_speaker = "Unknown"
        current_ts: str | None = None
        current_lines: list[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            ts, text = _parse_timestamp(stripped)
            speaker, content = _parse_explicit_label(text)

            if speaker:
                if current_lines:
                    utterances.append(
                        Utterance(
                            speaker=current_speaker,
                            text=" ".join(current_lines),
                            timestamp=current_ts,
                        )
                    )
                    current_lines = []
                current_speaker = speaker
                current_ts = ts
                current_lines.append(content)
            else:
                current_lines.append(text)

        if current_lines:
            utterances.append(
                Utterance(
                    speaker=current_speaker,
                    text=" ".join(current_lines),
                    timestamp=current_ts,
                )
            )

        return utterances

    # Step 2: Paragraph / double-newline segmentation
    paragraphs = raw_transcript.split("\n\n")
    if len(paragraphs) > 1:
        result: list[Utterance] = []
        speaker_id_counter = 1
        known_speakers: list[str] = []
        current_active_speaker: str | None = None
        next_expected_speaker: str | None = None

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            para_lines = para.splitlines()
            para_ts, first_line = _parse_timestamp(para_lines[0].strip())
            cleaned_lines = [first_line]
            for pl in para_lines[1:]:
                _, t = _parse_timestamp(pl.strip())
                cleaned_lines.append(t)
            turn_text = " ".join(cleaned_lines)

            intro = _infer_speaker_from_content(turn_text)
            if intro:
                assigned_speaker = intro
                if intro not in known_speakers:
                    known_speakers.append(intro)
            elif next_expected_speaker:
                assigned_speaker = next_expected_speaker
                next_expected_speaker = None
            else:
                if len(known_speakers) >= 2:
                    candidates = [s for s in known_speakers if s != current_active_speaker]
                    assigned_speaker = candidates[0] if candidates else known_speakers[0]
                elif len(known_speakers) == 1 and current_active_speaker != known_speakers[0]:
                    assigned_speaker = known_speakers[0]
                else:
                    assigned_speaker = f"Speaker {speaker_id_counter}"
                    speaker_id_counter += 1

            current_active_speaker = assigned_speaker
            result.append(
                Utterance(
                    speaker=assigned_speaker,
                    text=turn_text,
                    timestamp=para_ts,
                )
            )

            vocative = _detect_vocative_target(turn_text)
            if vocative:
                next_expected_speaker = vocative
                if vocative not in known_speakers:
                    known_speakers.append(vocative)

        return result

    # Step 3: Single newline line-by-line processing
    result = []
    speaker_id_counter = 1
    known_speakers = []
    current_active_speaker = None
    next_expected_speaker = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        ts, text = _parse_timestamp(stripped)
        intro = _infer_speaker_from_content(text)
        is_ack = bool(RESPONSE_ACKNOWLEDGMENT_REGEX.search(text))

        if intro:
            assigned_speaker = intro
            if intro not in known_speakers:
                known_speakers.append(intro)
            current_active_speaker = assigned_speaker
        elif next_expected_speaker:
            assigned_speaker = next_expected_speaker
            next_expected_speaker = None
            current_active_speaker = assigned_speaker
        elif is_ack:
            # Acknowledgement signals a turn switch to another speaker
            if len(known_speakers) >= 2:
                candidates = [s for s in known_speakers if s != current_active_speaker]
                assigned_speaker = candidates[0] if candidates else known_speakers[0]
            else:
                assigned_speaker = f"Speaker {speaker_id_counter}"
                speaker_id_counter += 1
            current_active_speaker = assigned_speaker
        elif current_active_speaker:
            # Continue with current active speaker
            assigned_speaker = current_active_speaker
        else:
            assigned_speaker = f"Speaker {speaker_id_counter}"
            speaker_id_counter += 1
            current_active_speaker = assigned_speaker

        result.append(
            Utterance(
                speaker=assigned_speaker,
                text=text,
                timestamp=ts,
            )
        )

        vocative = _detect_vocative_target(text)
        if vocative:
            next_expected_speaker = vocative
            if vocative not in known_speakers:
                known_speakers.append(vocative)

    return result
