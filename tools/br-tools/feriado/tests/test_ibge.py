import os
import tempfile
import unittest
from unittest.mock import patch
from br_feriado_checker.cache import CacheManager
from br_feriado_checker.ibge import IBGEClient, normalize_text


class TestIBGEClient(unittest.TestCase):

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.cache_file = os.path.join(self.tmp_dir.name, "test_cache.json")
        self.cache = CacheManager(cache_file=self.cache_file)
        self.client = IBGEClient(cache=self.cache)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_normalize_text(self):
        self.assertEqual(normalize_text("São Paulo"), "sao paulo")
        self.assertEqual(normalize_text("FLORIANÓPOLIS"), "florianopolis")
        self.assertEqual(normalize_text(""), "")

    @patch("br_feriado_checker.ibge.IBGEClient._fetch_url")
    def test_get_municipality_by_code(self, mock_fetch):
        mock_fetch.return_value = {
            "id": 3550308,
            "nome": "São Paulo",
            "microrregiao": {
                "mesorregiao": {
                    "UF": {"sigla": "SP"}
                }
            }
        }
        res = self.client.get_municipality_by_code("3550308")
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "3550308")
        self.assertEqual(res["nome"], "São Paulo")
        self.assertEqual(res["uf"], "SP")

        # Verify cached on second call without fetching URL again
        mock_fetch.reset_mock()
        cached_res = self.client.get_municipality_by_code("3550308")
        self.assertEqual(cached_res, res)
        mock_fetch.assert_not_called()

    @patch("br_feriado_checker.ibge.IBGEClient._fetch_url")
    def test_resolve_municipality(self, mock_fetch):
        mock_fetch.return_value = [
            {"id": 3550308, "nome": "São Paulo"},
            {"id": 3513801, "nome": "Curitiba"}
        ]
        res = self.client.resolve_municipality("São Paulo", "SP")
        self.assertIsNotNone(res)
        self.assertEqual(res["id"], "3550308")

    @patch("br_feriado_checker.ibge.IBGEClient._fetch_url")
    def test_fetch_municipal_holidays_fallback(self, mock_fetch):
        # Mock IBGE code lookup response
        mock_fetch.return_value = {
            "id": 3550308,
            "nome": "São Paulo",
            "microrregiao": {"mesorregiao": {"UF": {"sigla": "SP"}}}
        }

        holidays = self.client.fetch_municipal_holidays_fallback("3550308", 2025)
        self.assertTrue(len(holidays) >= 1)
        muni_h = [h for h in holidays if "São Paulo" in h["name"]]
        self.assertEqual(len(muni_h), 1)
        self.assertEqual(muni_h[0]["date"], "2025-01-25")


if __name__ == "__main__":
    unittest.main()
