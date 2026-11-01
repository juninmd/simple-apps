import unittest
from br_feriado_checker.city_matcher import CityMatcher, match_city, normalize_text


class TestNormalizeText(unittest.TestCase):
    def test_normalize_accents(self):
        self.assertEqual(normalize_text("São Paulo"), "sao paulo")
        self.assertEqual(normalize_text("Florianópolis"), "florianopolis")
        self.assertEqual(normalize_text("BRASÍLIA"), "brasilia")
        self.assertEqual(normalize_text(" Belém  "), "belem")

    def test_normalize_empty(self):
        self.assertEqual(normalize_text(""), "")
        self.assertEqual(normalize_text(None), "")


class TestCityMatcher(unittest.TestCase):
    def test_exact_and_normalized_match(self):
        self.assertEqual(match_city("sao paulo"), "São Paulo")
        self.assertEqual(match_city("SAO PAULO"), "São Paulo")
        self.assertEqual(match_city("São Paulo"), "São Paulo")
        self.assertEqual(match_city("rio de janeiro"), "Rio de Janeiro")
        self.assertEqual(match_city("florianopolis"), "Florianópolis")
        self.assertEqual(match_city("brasilia"), "Brasília")

    def test_fuzzy_match(self):
        self.assertEqual(match_city("sao paolo"), "São Paulo")
        self.assertEqual(match_city("rio de janeiru"), "Rio de Janeiro")
        self.assertEqual(match_city("florianopolls"), "Florianópolis")

    def test_custom_candidate_cities(self):
        custom_cities = ["Tokio", "Paris", "New York", "São Paulo"]
        self.assertEqual(match_city("paris", candidate_cities=custom_cities), "Paris")
        self.assertEqual(match_city("pary", candidate_cities=custom_cities), "Paris")
        self.assertEqual(match_city("tokyo", candidate_cities=custom_cities), "Tokio")

    def test_no_match_unknown_city(self):
        self.assertIsNone(match_city("xyz12345nonexistentcity"))
        self.assertIsNone(match_city(""))
        self.assertIsNone(match_city("   "))


if __name__ == "__main__":
    unittest.main()
