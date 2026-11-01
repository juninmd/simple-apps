"""Tests for CLI module."""

import io
import json
import unittest
from unittest.mock import patch
from cep_lookup.cli import main, parse_args, format_text_results


class TestCLIModule(unittest.TestCase):
    def test_parse_args(self):
        args = parse_args(["01001-000", "01002-000", "-j", "-w", "10"])
        self.assertEqual(args.ceps, ["01001-000", "01002-000"])
        self.assertTrue(args.json)
        self.assertEqual(args.workers, 10)

    def test_format_text_results(self):
        summary = {
            "total": 2,
            "successful": 1,
            "failed": 1,
            "results": [
                {
                    "cep": "01001-000",
                    "success": True,
                    "data": {
                        "cep": "01001-000",
                        "logradouro": "Praça da Sé",
                        "bairro": "Sé",
                        "localidade": "São Paulo",
                        "uf": "SP"
                    }
                },
                {
                    "cep": "00000-000",
                    "success": False,
                    "error": "CEP not found"
                }
            ]
        }
        text = format_text_results(summary)
        self.assertIn("Batch CEP Lookup Results (1/2 successful)", text)
        self.assertIn("✓ 01001-000: 01001-000 - Praça da Sé, Sé, São Paulo-SP", text)
        self.assertIn("✗ 00000-000: Error: CEP not found", text)

    @patch("cep_lookup.cli.fetch_ceps_batch")
    def test_main_with_arguments(self, mock_fetch):
        mock_fetch.return_value = [
            {
                "cep": "01001000",
                "success": True,
                "error": None,
                "data": {"cep": "01001-000", "logradouro": "Sé", "bairro": "Sé", "localidade": "SP", "uf": "SP"}
            }
        ]
        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            exit_code = main(["01001000", "--json"])
            self.assertEqual(exit_code, 0)
            output = json.loads(mock_stdout.getvalue())
            self.assertEqual(output["total"], 1)
            self.assertEqual(output["successful"], 1)

    @patch("cep_lookup.cli.read_ceps_from_stdin")
    def test_main_no_ceps_error(self, mock_read_stdin):
        mock_read_stdin.return_value = []
        with patch("sys.stderr", new_callable=io.StringIO) as mock_stderr:
            exit_code = main([])
            self.assertEqual(exit_code, 1)
            self.assertIn("Error: No CEPs provided", mock_stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
