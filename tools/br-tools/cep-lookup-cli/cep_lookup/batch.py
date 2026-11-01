"""Batch processing module for CEP lookup."""

import concurrent.futures
import sys
from typing import Iterable, List, Dict, Any, TextIO, Optional
from cep_lookup.api import fetch_cep


def extract_ceps_from_lines(lines: Iterable[str]) -> List[str]:
    """
    Extract CEP strings from iterable lines of text.
    Handles space/comma/newline separated inputs.
    """
    ceps = []
    for line in lines:
        # Replace commas with spaces
        line_clean = line.replace(",", " ")
        parts = line_clean.strip().split()
        for part in parts:
            if part:
                ceps.append(part)
    return ceps


def read_ceps_from_stdin(stdin_stream: Optional[TextIO] = None) -> List[str]:
    """Read lines from stdin stream and extract CEPs."""
    if stdin_stream is None:
        stdin_stream = sys.stdin
    if stdin_stream.isatty():
        return []
    return extract_ceps_from_lines(stdin_stream)


def fetch_ceps_batch(
    ceps: List[str],
    max_workers: int = 5,
    timeout: float = 10.0
) -> List[Dict[str, Any]]:
    """
    Fetch CEP details for a list of CEPs concurrently.
    Preserves original order of input CEPs.
    """
    if not ceps:
        return []

    results_map = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_index = {
            executor.submit(fetch_cep, cep, timeout): i
            for i, cep in enumerate(ceps)
        }
        for future in concurrent.futures.as_completed(future_to_index):
            i = future_to_index[future]
            try:
                res = future.result()
            except Exception as e:
                res = {
                    "cep": ceps[i],
                    "success": False,
                    "error": str(e),
                    "data": None,
                }
            results_map[i] = res

    return [results_map[i] for i in range(len(ceps))]


def summarize_batch_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Summarize aggregated results.
    """
    total = len(results)
    successful = sum(1 for r in results if r.get("success"))
    failed = total - successful
    return {
        "total": total,
        "successful": successful,
        "failed": failed,
        "results": results,
    }
