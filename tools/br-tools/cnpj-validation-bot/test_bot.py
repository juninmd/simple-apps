import pytest
from bot import CNPJBot, is_valid_cnpj, format_cnpj, clean_cnpj

# Valid CNPJs
VALID_CNPJS = [
    "00.000.000/0001-91",  # Banco do Brasil
    "33.000.167/0001-01",  # Petrobras
    "06.990.590/0001-23",  # Google Brasil
    "79.884.514/0001-07",  # Generated valid 1
    "79.420.257/0001-52",  # Generated valid 2
    "56.499.673/0001-92",  # Generated valid 3
]

def test_is_valid_cnpj():
    assert is_valid_cnpj(VALID_CNPJS[0]) is True
    assert is_valid_cnpj(VALID_CNPJS[1]) is True
    assert is_valid_cnpj("00000000000000") is False
    assert is_valid_cnpj("12345678901234") is False

def test_empty_history():
    bot = CNPJBot()
    assert bot.get_history("user1") == []
    response = bot.handle_history_command("user1")
    assert response == "Nenhum histórico de busca encontrado."

def test_single_lookup_history():
    bot = CNPJBot()
    response = bot.handle_lookup("user1", VALID_CNPJS[0])
    assert "Consulta realizada" in response

    history = bot.get_history("user1")
    assert len(history) == 1
    assert history[0] == VALID_CNPJS[0]

    hist_resp = bot.handle_history_command("user1")
    assert "1. 00.000.000/0001-91" in hist_resp

def test_history_limit_five():
    bot = CNPJBot(max_history=5)

    for cnpj in VALID_CNPJS:
        bot.handle_lookup("user1", cnpj)

    history = bot.get_history("user1")
    assert len(history) == 5
    # Should keep the last 5 searched CNPJs
    expected = VALID_CNPJS[1:]
    assert history == expected

def test_invalid_cnpj_not_added_to_history():
    bot = CNPJBot()
    resp = bot.handle_lookup("user1", "1234")
    assert "CNPJ inválido" in resp
    assert len(bot.get_history("user1")) == 0

def test_user_isolation():
    bot = CNPJBot()
    bot.handle_lookup("user1", VALID_CNPJS[0])
    bot.handle_lookup("user2", VALID_CNPJS[1])

    assert bot.get_history("user1") == [VALID_CNPJS[0]]
    assert bot.get_history("user2") == [VALID_CNPJS[1]]
