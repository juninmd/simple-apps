import re
from typing import Dict, List, Optional

def clean_cnpj(cnpj: str) -> str:
    """Remove non-digit characters from CNPJ string."""
    return re.sub(r"\D", "", cnpj)

def format_cnpj(cnpj: str) -> str:
    """Format 14-digit CNPJ string as XX.XXX.XXX/XXXX-XX."""
    digits = clean_cnpj(cnpj)
    if len(digits) != 14:
        return cnpj
    return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"

def is_valid_cnpj(cnpj: str) -> bool:
    """Validate standard Brazilian CNPJ format (14 digits) and checksum algorithm."""
    digits = clean_cnpj(cnpj)
    if len(digits) != 14 or len(set(digits)) == 1:
        return False

    # First digit check
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum1 = sum(int(d) * w for d, w in zip(digits[:12], weights1))
    rev1 = 11 - (sum1 % 11)
    d1 = 0 if rev1 >= 10 else rev1
    if int(digits[12]) != d1:
        return False

    # Second digit check
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum2 = sum(int(d) * w for d, w in zip(digits[:13], weights2))
    rev2 = 11 - (sum2 % 11)
    d2 = 0 if rev2 >= 10 else rev2
    if int(digits[13]) != d2:
        return False

    return True

class CNPJBot:
    """Bot manager handling CNPJ queries and per-user lookup history."""

    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self._history: Dict[str, List[str]] = {}

    def add_history(self, user_id: str | int, cnpj: str) -> None:
        """Add a CNPJ lookup to user history, keeping at most max_history items."""
        uid = str(user_id)
        if uid not in self._history:
            self._history[uid] = []
        formatted = format_cnpj(cnpj)
        # Avoid duplicate consecutive entries if needed, or append directly
        self._history[uid].append(formatted)
        if len(self._history[uid]) > self.max_history:
            self._history[uid] = self._history[uid][-self.max_history:]

    def get_history(self, user_id: str | int) -> List[str]:
        """Retrieve the last searched CNPJs for a user."""
        uid = str(user_id)
        return list(self._history.get(uid, []))

    def handle_lookup(self, user_id: str | int, cnpj_input: str) -> str:
        """Handle CNPJ search query."""
        digits = clean_cnpj(cnpj_input)
        if not is_valid_cnpj(digits):
            return f"CNPJ inválido: {cnpj_input}"

        formatted = format_cnpj(digits)
        self.add_history(user_id, formatted)
        return f"CNPJ {formatted}: Ativo / Consulta realizada com sucesso."

    def handle_history_command(self, user_id: str | int) -> str:
        """Handle /history command listing the last 5 lookups."""
        history = self.get_history(user_id)
        if not history:
            return "Nenhum histórico de busca encontrado."

        lines = [f"{i+1}. {cnpj}" for i, cnpj in enumerate(history)]
        return "Histórico das últimas buscas de CNPJ:\n" + "\n".join(lines)
