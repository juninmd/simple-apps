import datetime
import json
import os
import tempfile
import unittest
from unittest.mock import patch

from scripts.update_holidays import (
    calculate_easter,
    get_fallback_holidays,
    update_holidays,
)


class TestUpdateHolidays(unittest.TestCase):

    def test_calculate_easter(self):
        self.assertEqual(calculate_easter(2025), datetime.date(2025, 4, 20))
        self.assertEqual(calculate_easter(2026), datetime.date(2026, 4, 5))
        self.assertEqual(calculate_easter(2027), datetime.date(2027, 3, 28))

    def test_get_fallback_holidays(self):
        holidays = get_fallback_holidays(2026)
        self.assertTrue(len(holidays) >= 12)
        dates = [h["date"] for h in holidays]
        self.assertIn("2026-01-01", dates)
        self.assertIn("2026-09-07", dates)
        self.assertIn("2026-12-25", dates)

    @patch("scripts.update_holidays.fetch_holidays_from_api")
    def test_update_holidays(self, mock_fetch):
        mock_fetch.return_value = [
            {"date": "2026-01-01", "name": "Confraternização Universal", "type": "national"},
            {"date": "2026-09-07", "name": "Independência do Brasil", "type": "national"}
        ]
        with tempfile.NamedTemporaryFile(suffix=".json") as tmp:
            with patch("scripts.update_holidays.DATA_FILE", tmp.name):
                res = update_holidays(2026, 2026)
                self.assertTrue(len(res) >= 2)
                self.assertEqual(res[0]["date"], "2026-01-01")


if __name__ == "__main__":
    unittest.main()
