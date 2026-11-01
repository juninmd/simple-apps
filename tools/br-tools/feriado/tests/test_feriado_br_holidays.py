import datetime
import unittest
from feriado_br.holidays import get_holidays, _calculate_easter, Holiday


class TestHolidays(unittest.TestCase):
    def test_easter_calculation(self):
        # Easter 2024 is March 31, 2024
        self.assertEqual(_calculate_easter(2024), datetime.date(2024, 3, 31))
        # Easter 2026 is April 5, 2026
        self.assertEqual(_calculate_easter(2026), datetime.date(2026, 4, 5))

    def test_national_holidays(self):
        holidays = get_holidays(2026, holiday_type="national")
        self.assertTrue(any(h.name == "Confraternização Universal" and h.date == datetime.date(2026, 1, 1) for h in holidays))
        self.assertTrue(any(h.name == "Independência do Brasil" and h.date == datetime.date(2026, 9, 7) for h in holidays))
        self.assertTrue(any(h.name == "Natal" and h.date == datetime.date(2026, 12, 25) for h in holidays))

    def test_state_holidays(self):
        holidays_sp = get_holidays(2026, state="SP", holiday_type="state")
        self.assertTrue(any(h.name == "Revolução Constitucionalista de 1932" for h in holidays_sp))
        self.assertTrue(all(h.location == "SP" for h in holidays_sp))

        holidays_rj = get_holidays(2026, state="RJ", holiday_type="state")
        self.assertTrue(any(h.name == "Dia de São Jorge" for h in holidays_rj))

    def test_municipal_holidays(self):
        # Test São Paulo city with accent and lower case
        holidays_sp = get_holidays(2026, state="SP", city="são paulo", holiday_type="municipal")
        self.assertTrue(any(h.name == "Aniversário da Cidade de São Paulo" and h.date == datetime.date(2026, 1, 25) for h in holidays_sp))

        # Test Rio de Janeiro city
        holidays_rj = get_holidays(2026, state="RJ", city="Rio de Janeiro", holiday_type="municipal")
        self.assertTrue(any(h.name == "Dia de São Sebastião" and h.date == datetime.date(2026, 1, 20) for h in holidays_rj))

    def test_combined_filters(self):
        holidays = get_holidays(2026, state="SP", city="São Paulo")
        types = {h.type for h in holidays}
        self.assertIn("national", types)
        self.assertIn("state", types)
        self.assertIn("municipal", types)


if __name__ == "__main__":
    unittest.main()
