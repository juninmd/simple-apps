import datetime
import io
import json
import sys
import unittest
from unittest.mock import patch

from feriado_br.cli import main, parse_args


class TestCLI(unittest.TestCase):
    def test_parse_args_defaults(self):
        args = parse_args([])
        self.assertIsNotNone(args.target_year)
        self.assertIsNone(args.state)
        self.assertIsNone(args.city)
        self.assertFalse(args.json)

    def test_parse_args_custom(self):
        args = parse_args(["2025", "-s", "SP", "-c", "São Paulo", "-j", "-t", "municipal"])
        self.assertEqual(args.target_year, 2025)
        self.assertEqual(args.state, "SP")
        self.assertEqual(args.city, "São Paulo")
        self.assertEqual(args.type, "municipal")
        self.assertTrue(args.json)

    def test_main_text_output(self):
        buf = io.StringIO()
        with patch.object(sys, "stdout", buf):
            main(["2026", "-s", "SP", "-c", "São Paulo", "-t", "municipal"])
        output = buf.getvalue()
        self.assertIn("Feriados para 2026:", output)
        self.assertIn("Aniversário da Cidade de São Paulo", output)

    def test_main_json_output(self):
        buf = io.StringIO()
        with patch.object(sys, "stdout", buf):
            main(["2026", "-s", "RJ", "-c", "Rio de Janeiro", "-j"])
        output = buf.getvalue()
        data = json.loads(output)
        self.assertIsInstance(data, list)
        self.assertTrue(any(item["name"] == "Dia de São Sebastião" and item["type"] == "municipal" for item in data))


    def test_next_holiday_text(self):
        buf = io.StringIO()
        with patch.object(sys, "stdout", buf), patch("feriado_br.cli.datetime") as dt:
            dt.date.today.return_value = datetime.date(2026, 12, 20)
            main(["--next", "-t", "national"])
        out = buf.getvalue()
        self.assertIn("25/12/2026", out)
        self.assertIn("Próximo feriado", out)

    def test_next_holiday_rolls_to_next_year(self):
        buf = io.StringIO()
        with patch.object(sys, "stdout", buf), patch("feriado_br.cli.datetime") as dt:
            dt.date.today.return_value = datetime.date(2026, 12, 26)
            main(["--next", "-t", "national", "-j"])
        data = json.loads(buf.getvalue())
        self.assertEqual(len(data), 1)
        self.assertTrue(data[0]["date"].startswith("2027-01-01"))

if __name__ == "__main__":
    unittest.main()
