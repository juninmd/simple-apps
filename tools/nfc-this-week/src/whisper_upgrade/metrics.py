"""Metrics calculation for transcription accuracy and Word Error Rate (WER)."""

import re
from typing import Any


def normalize_text(text: str) -> str:
    """Normalize text by lowercasing and stripping punctuation and excess whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s\$\.]", " ", text)
    tokens = text.split()
    return " ".join(tokens)


def compute_wer(reference: str, hypothesis: str) -> float:
    """Compute Word Error Rate (WER) using Levenshtein distance on tokenized words.

    WER = (Substitutions + Deletions + Insertions) / Number of Reference Words.
    """
    ref_words = normalize_text(reference).split()
    hyp_words = normalize_text(hypothesis).split()

    if not ref_words:
        return 0.0 if not hyp_words else float(len(hyp_words))

    r_len = len(ref_words)
    h_len = len(hyp_words)

    # Dynamic programming distance matrix
    d = [[0] * (h_len + 1) for _ in range(r_len + 1)]

    for i in range(r_len + 1):
        d[i][0] = i
    for j in range(h_len + 1):
        d[0][j] = j

    for i in range(1, r_len + 1):
        for j in range(1, h_len + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                d[i][j] = d[i - 1][j - 1]
            else:
                substitution = d[i - 1][j - 1] + 1
                insertion = d[i][j - 1] + 1
                deletion = d[i - 1][j] + 1
                d[i][j] = min(substitution, insertion, deletion)

    wer = d[r_len][h_len] / float(r_len)
    return wer


def evaluate_fixtures(fixtures: list[dict[str, Any]]) -> dict[str, Any]:
    """Evaluate WER across fixtures for tiny.en and base.en.

    Returns individual and aggregate WER along with the relative WER reduction:
    reduction = (tiny_wer - base_wer) / tiny_wer
    """
    tiny_wers: list[float] = []
    base_wers: list[float] = []
    details: list[dict[str, Any]] = []

    for idx, fixture in enumerate(fixtures):
        ref = fixture["ground_truth"]
        tiny_hyp = fixture["tiny_transcript"]
        base_hyp = fixture["base_transcript"]

        t_wer = compute_wer(ref, tiny_hyp)
        b_wer = compute_wer(ref, base_hyp)

        tiny_wers.append(t_wer)
        base_wers.append(b_wer)

        fixture_reduction = ((t_wer - b_wer) / t_wer) if t_wer > 0 else 0.0
        details.append({
            "fixture_id": fixture.get("id", idx + 1),
            "name": fixture.get("name", f"Fixture #{idx + 1}"),
            "tiny_wer": t_wer,
            "base_wer": b_wer,
            "reduction": fixture_reduction,
        })

    avg_tiny_wer = sum(tiny_wers) / len(tiny_wers) if tiny_wers else 0.0
    avg_base_wer = sum(base_wers) / len(base_wers) if base_wers else 0.0
    overall_reduction = (
        ((avg_tiny_wer - avg_base_wer) / avg_tiny_wer) if avg_tiny_wer > 0 else 0.0
    )

    return {
        "count": len(fixtures),
        "avg_tiny_wer": avg_tiny_wer,
        "avg_base_wer": avg_base_wer,
        "relative_wer_reduction": overall_reduction,
        "meets_30_percent_reduction": overall_reduction >= 0.30,
        "fixtures": details,
    }
