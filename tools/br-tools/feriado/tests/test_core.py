import os
import tempfile
import unittest
from br_feriado_checker.cache import CacheManager
from br_feriado_checker.core import HolidayChecker


class TestHolidayChecker(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.cache_file = os.path.join(self.tmp_dir.name, "test_cache.json")
        self.cache = CacheManager(cache_file=self.cache_file)
        self.checker = HolidayChecker(cache=self.cache)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_check_holiday_national(self):
        res = self.checker.check_holiday("2025-01-01")
        self.assertTrue(res["is_holiday"])
        self.assertEqual(res["holidays"][0]["name"], "Confraternização Universal")

    def test_check_holiday_state(self):
        res = self.checker.check_holiday("2025-07-09", uf="SP")
        self.assertTrue(res["is_holiday"])
        self.assertEqual(res["holidays"][0]["name"], "Revolução Constitucionalista de 1932")

    def test_check_holiday_municipal(self):
        res = self.checker.check_holiday("2025-01-25", city="São Paulo", uf="SP")
        self.assertTrue(res["is_holiday"])
        self.assertEqual(res["location"]["ibge_code"], "3550308")
        muni_h = [h for h in res["holidays"] if h["type"] == "municipal"]
        self.assertEqual(len(muni_h), 1)

    def test_check_holiday_non_holiday(self):
        res = self.checker.check_holiday("2025-05-15", city="São Paulo", uf="SP")
        self.assertFalse(res["is_holiday"])
        self.assertEqual(len(res["holidays"]), 0)

    def test_invalid_date_format(self):
        with self.assertRaises(ValueError):
            self.checker.check_holiday("25-01-2025")


if __name__ == "__main__":
    unittest.main()
