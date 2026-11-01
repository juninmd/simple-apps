"""Tests for batch processing module."""

import io
import unittest
from unittest.mock import patch
from cep_lookup.batch import (
    extract_ceps_from_lines,
    read_ceps_from_stdin,
    fetch_ceps_batch,
    summarize_batch_results,
)


class TestBatchModule(unittest.TestCase):
    def test_extract_ceps_from_lines(self):
        lines = [
            "01001-000, 01002-000\n",
            "01003-000 01004-000\n",
            "  01005-000  \n"
        ]
        ceps = extract_ceps_from_lines(lines)
        self.assertEqual(
            ceps,
            ["01001-000", "01002-000", "01003-000", "01004-000", "01005-000"]
        )

    def test_read_ceps_from_stdin(self):
        fake_stdin = io.StringIO("01001-000\n01002-000\n")
        fake_stdin.isatty = lambda: False
        ceps = read_ceps_from_stdin(fake_stdin)
        self.assertEqual(ceps, ["01001-000", "01002-000"])

    def test_read_ceps_from_stdin_tty(self):
        fake_stdin = io.StringIO("01001-000\n")
        fake_stdin.isatty = lambda: True
        ceps = read_ceps_from_stdin(fake_stdin)
        self.assertEqual(ceps, [])

    @patch("cep_lookup.batch.fetch_cep")
    def test_fetch_ceps_batch(self, mock_fetch):
        def mock_fetch_impl(cep, timeout=10.0):
            if cep == "01001000":
                return {"cep": cep, "success": True, "error": None, "data": {"cep": "01001-000"}}
            return {"cep": cep, "success": False, "error": "Not found", "data": None}

        mock_fetch.side_effect = mock_fetch_impl

        results = fetch_ceps_batch(["01001000", "99999999"])
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["cep"], "01001000")
        self.assertTrue(results[0]["success"])
        self.assertEqual(results[1]["cep"], "99999999")
        self.assertFalse(results[1]["success"])

    def test_summarize_batch_results(self):
        results = [
            {"cep": "1", "success": True},
            {"cep": "2", "success": False},
        ]
        summary = summarize_batch_results(results)
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["successful"], 1)
        self.assertEqual(summary["failed"], 1)


if __name__ == "__main__":
    unittest.main()
