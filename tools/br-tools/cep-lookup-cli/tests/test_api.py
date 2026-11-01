"""Tests for API module."""

import json
import unittest
import urllib.error
from unittest.mock import patch, MagicMock
from cep_lookup.api import normalize_cep, validate_cep, fetch_cep


class TestAPIModule(unittest.TestCase):
    def test_normalize_cep(self):
        self.assertEqual(normalize_cep("01001-000"), "01001000")
        self.assertEqual(normalize_cep("01001000"), "01001000")
        self.assertEqual(normalize_cep("01.001-000"), "01001000")
        self.assertEqual(normalize_cep("abc"), "")

    def test_validate_cep(self):
        self.assertTrue(validate_cep("01001-000"))
        self.assertTrue(validate_cep("01001000"))
        self.assertFalse(validate_cep("123"))
        self.assertFalse(validate_cep("123456789"))

    @patch("urllib.request.urlopen")
    def test_fetch_cep_success(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "cep": "01001-000",
            "logradouro": "Praça da Sé",
            "complemento": "lado ímpar",
            "bairro": "Sé",
            "localidade": "São Paulo",
            "uf": "SP",
            "ibge": "3550308",
            "gia": "1004",
            "ddd": "11",
            "siafi": "7107"
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = fetch_cep("01001-000")
        self.assertTrue(res["success"])
        self.assertIsNone(res["error"])
        self.assertEqual(res["data"]["logradouro"], "Praça da Sé")
        self.assertEqual(res["data"]["uf"], "SP")

    @patch("urllib.request.urlopen")
    def test_fetch_cep_not_found(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({"erro": "true"}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = fetch_cep("99999-999")
        self.assertFalse(res["success"])
        self.assertEqual(res["error"], "CEP not found")

    @patch("urllib.request.urlopen")
    def test_fetch_cep_http_error_is_not_reported_as_network_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://viacep.com.br/ws/01001000/json/", 404, "Not Found", None, None
        )

        res = fetch_cep("01001-000")
        self.assertFalse(res["success"])
        self.assertEqual(res["error"], "HTTP Error 404")

    def test_fetch_cep_invalid_format(self):
        res = fetch_cep("invalid")
        self.assertFalse(res["success"])
        self.assertIn("Invalid CEP format", res["error"])


if __name__ == "__main__":
    unittest.main()
