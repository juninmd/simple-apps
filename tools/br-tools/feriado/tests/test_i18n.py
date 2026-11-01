"""Tests for i18n module."""

import os
import unittest
from unittest.mock import patch

from br_feriado_checker.i18n import detect_locale, get_message, normalize_locale


class TestI18n(unittest.TestCase):

    def test_normalize_locale(self):
        self.assertEqual(normalize_locale("pt_BR"), "pt_BR")
        self.assertEqual(normalize_locale("pt-BR"), "pt_BR")
        self.assertEqual(normalize_locale("pt"), "pt_BR")
        self.assertEqual(normalize_locale("en_US"), "en")
        self.assertEqual(normalize_locale("en"), "en")
        self.assertEqual(normalize_locale("fr_FR"), "pt_BR")  # Default fallback
        self.assertEqual(normalize_locale(""), "pt_BR")

    def test_detect_locale_cli_arg(self):
        self.assertEqual(detect_locale("en"), "en")
        self.assertEqual(detect_locale("pt_BR"), "pt_BR")

    @patch.dict(os.environ, {"LANG": "en_US.UTF-8"}, clear=True)
    def test_detect_locale_env_lang(self):
        self.assertEqual(detect_locale(), "en")

    @patch.dict(os.environ, {"LC_ALL": "pt_BR.UTF-8", "LANG": "en_US.UTF-8"}, clear=True)
    def test_detect_locale_env_priority(self):
        self.assertEqual(detect_locale(), "pt_BR")

    @patch.dict(os.environ, {}, clear=True)
    def test_detect_locale_default(self):
        with patch("locale.getdefaultlocale", return_value=(None, None)):
            self.assertEqual(detect_locale(), "pt_BR")

    def test_get_message_pt(self):
        msg = get_message("date_is_holiday", "pt_BR", date="2025-01-01", name="Confraternização Universal", type="Nacional")
        self.assertEqual(msg, "2025-01-01 é feriado: Confraternização Universal (Nacional)")

    def test_get_message_en(self):
        msg = get_message("date_is_holiday", "en", date="2025-01-01", name="New Year's Day", type="National")
        self.assertEqual(msg, "2025-01-01 is a holiday: New Year's Day (National)")


if __name__ == "__main__":
    unittest.main()
