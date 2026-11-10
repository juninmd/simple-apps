import io
import sys
import unittest
from unittest.mock import patch

from brasilidade.cli import run_quiz, run_search, main


class TestCLI(unittest.TestCase):
    @patch("builtins.input", side_effect=["1", "1", "1", "1", "1", "1", "1", "1"])
    def test_run_quiz(self, mock_input):
        captured_output = io.StringIO()
        sys.stdout = captured_output
        try:
            run_quiz(limit=2, shuffle=False)
        finally:
            sys.stdout = sys.__stdout__

        output = captured_output.getvalue()
        self.assertIn("BRASILIDADE - QUIZ DE CULTURA BRASILEIRA", output)
        self.assertIn("RESULTADO FINAL DO QUIZ", output)

    @patch("builtins.input", side_effect=["x", "1"])
    def test_run_quiz_reprompts_on_non_numeric_input(self, mock_input):
        captured_output = io.StringIO()
        sys.stdout = captured_output
        try:
            run_quiz(limit=1, shuffle=False)
        finally:
            sys.stdout = sys.__stdout__

        output = captured_output.getvalue()
        self.assertNotIn("Quiz cancelado", output)
        self.assertIn("RESULTADO FINAL DO QUIZ", output)
        self.assertEqual(mock_input.call_count, 2)

    def test_run_search(self):
        captured_output = io.StringIO()
        sys.stdout = captured_output
        try:
            run_search("saudade")
        finally:
            sys.stdout = sys.__stdout__

        output = captured_output.getvalue()
        self.assertIn("Busca na Enciclopédia: 'saudade'", output)
        self.assertIn("Saudade", output)

    @patch("sys.argv", ["brasilidade", "search", "capoeira"])
    def test_main_search_command(self):
        captured_output = io.StringIO()
        sys.stdout = captured_output
        try:
            main()
        finally:
            sys.stdout = sys.__stdout__

        output = captured_output.getvalue()
        self.assertIn("Capoeira", output)


if __name__ == "__main__":
    unittest.main()
