class APIRateLimitError(Exception):
    """Exception raised when the API rate limit is reached."""
    pass

def lookup_cnpj(cnpj: str, api_client, local_db) -> dict:
    """
    Look up CNPJ business details using live API with local DB fallback when rate limited.
    """
    try:
        data = api_client.get_cnpj(cnpj)
        return {
            "source": "api",
            "data": data
        }
    except APIRateLimitError:
        data = local_db.get_cnpj(cnpj)
        return {
            "message": "⚠️ API limit reached. Using local database.",
            "source": "local_db",
            "data": data
        }
