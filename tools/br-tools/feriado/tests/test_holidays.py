"""Tests for holiday calculations."""

import datetime
import unittest
from br_feriado_checker.holidays import (
    get_easter_sunday,
    get_national_holidays,
    get_holidays,
    is_holiday
)

class TestHolidays(unittest.TestCase):

    def test_easter_sunday(self):
        # Known Easter Sunday dates
        self.assertEqual(get_easter_sunday(2024), datetime.date(2024, 3, 31))
        self.assertEqual(get_easter_sunday(2025), datetime.date(2025, 4, 20))
        self.assertEqual(get_easter_sunday(2026), datetime.date(2026, 4, 5))

    def test_national_holidays_2026(self):
        holidays = get_national_holidays(2026)
        dates = [h.date for h in holidays]

        # Check fixed holidays
        self.assertIn(datetime.date(2026, 1, 1), dates)
        self.assertIn(datetime.date(2026, 4, 21), dates)
        self.assertIn(datetime.date(2026, 5, 1), dates)
        self.assertIn(datetime.date(2026, 9, 7), dates)
        self.assertIn(datetime.date(2026, 10, 12), dates)
        self.assertIn(datetime.date(2026, 11, 2), dates)
        self.assertIn(datetime.date(2026, 11, 15), dates)
        self.assertIn(datetime.date(2026, 11, 20), dates)
        self.assertIn(datetime.date(2026, 12, 25), dates)

        # Check moveable holidays for Easter on 2026-04-05
        self.assertIn(datetime.date(2026, 2, 16), dates)  # Carnaval Monday
        self.assertIn(datetime.date(2026, 2, 17), dates)  # Carnaval Tuesday
        self.assertIn(datetime.date(2026, 4, 3), dates)   # Good Friday
        self.assertIn(datetime.date(2026, 6, 4), dates)   # Corpus Christi

    def test_state_and_city_holidays(self):
        holidays_sp = get_holidays(2026, state="SP", city="sao paulo")
        names = [h.name for h in holidays_sp]

        self.assertIn("Revolução Constitucionalista", names)
        self.assertIn("Aniversário da Cidade de São Paulo", names)

    def test_is_holiday(self):
        res = is_holiday(datetime.date(2026, 12, 25))
        self.assertIsNotNone(res)
        self.assertEqual(res.name, "Natal")

        res_workday = is_holiday(datetime.date(2026, 3, 10))
        self.assertIsNone(res_workday)


if __name__ == "__main__":
    unittest.main()
