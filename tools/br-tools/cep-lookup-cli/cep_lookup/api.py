"""API client module for querying ViaCEP."""

import json
import re
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional


def normalize_cep(cep: str) -> str:
    """Return only the digits of a CEP string (may be any length; validate with validate_cep)."""
    digits = re.sub(r"\D", "", cep)
    return digits


def validate_cep(cep: str) -> bool:
    """Check if normalized CEP is exactly 8 digits."""
    return len(normalize_cep(cep)) == 8


def fetch_cep(cep: str, timeout: float = 10.0) -> Dict[str, Any]:
    """
    Fetch CEP data from ViaCEP API.
    Returns dict with keys: cep, success, data, error.
    """
    clean_cep = normalize_cep(cep)
    if not validate_cep(cep):
        return {
            "cep": cep,
            "success": False,
            "error": "Invalid CEP format. Must contain 8 digits.",
            "data": None,
        }

    url = f"https://viacep.com.br/ws/{clean_cep}/json/"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "cep-lookup-cli/0.1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status != 200:
                return {
                    "cep": cep,
                    "success": False,
                    "error": f"HTTP Error {response.status}",
                    "data": None,
                }
            raw_data = response.read().decode("utf-8")
            data = json.loads(raw_data)

            if data.get("erro") is True or data.get("erro") == "true":
                return {
                    "cep": cep,
                    "success": False,
                    "error": "CEP not found",
                    "data": None,
                }

            return {
                "cep": cep,
                "success": True,
                "error": None,
                "data": {
                    "cep": data.get("cep", clean_cep),
                    "logradouro": data.get("logradouro", ""),
                    "complemento": data.get("complemento", ""),
                    "bairro": data.get("bairro", ""),
                    "localidade": data.get("localidade", ""),
                    "uf": data.get("uf", ""),
                    "ibge": data.get("ibge", ""),
                    "gia": data.get("gia", ""),
                    "ddd": data.get("ddd", ""),
                    "siafi": data.get("siafi", ""),
                },
            }
    except urllib.error.HTTPError as e:
        return {
            "cep": cep,
            "success": False,
            "error": f"HTTP Error {e.code}",
            "data": None,
        }
    except urllib.error.URLError as e:
        return {
            "cep": cep,
            "success": False,
            "error": f"Network error: {e.reason}",
            "data": None,
        }
    except Exception as e:
        return {
            "cep": cep,
            "success": False,
            "error": f"Error: {str(e)}",
            "data": None,
        }
