import unittest
from unittest.mock import MagicMock
from cnpj_service import lookup_cnpj, APIRateLimitError

class TestCNPJService(unittest.TestCase):
    def test_lookup_cnpj_rate_limit_fallback(self):
        api_client = MagicMock()
        api_client.get_cnpj.side_effect = APIRateLimitError("API rate limit exceeded")

        local_db = MagicMock()
        local_db.get_cnpj.return_value = {
            "cnpj": "00000000000191",
            "company_name": "Empresa Teste LTDA"
        }

        result = lookup_cnpj("00000000000191", api_client, local_db)

        self.assertEqual(result["message"], "⚠️ API limit reached. Using local database.")
        self.assertEqual(result["source"], "local_db")
        self.assertEqual(result["data"], {
            "cnpj": "00000000000191",
            "company_name": "Empresa Teste LTDA"
        })

    def test_lookup_cnpj_api_success(self):
        api_client = MagicMock()
        api_client.get_cnpj.return_value = {
            "cnpj": "00000000000191",
            "company_name": "Empresa Teste LTDA"
        }

        local_db = MagicMock()

        result = lookup_cnpj("00000000000191", api_client, local_db)

        self.assertNotIn("message", result)
        self.assertEqual(result["source"], "api")
        self.assertEqual(result["data"], {
            "cnpj": "00000000000191",
            "company_name": "Empresa Teste LTDA"
        })

if __name__ == "__main__":
    unittest.main()
