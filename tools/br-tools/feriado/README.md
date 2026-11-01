# br-feriado

Feriados do Brasil (nacionais, estaduais, municipais). Unifica os antigos
`feriado-br-cli` e `br-feriado-checker`.

- `feriado-br`: lista feriados do ano (`-y`, `-s UF`, `-c cidade`, `-t tipo`, `--json`, `--next`). Pacote `feriado_br`.
- `br-feriado-checker`: verifica uma data, exporta iCal, usa IBGE/cache. Pacote `br_feriado_checker`.

## Testes
`python -m unittest discover -s tests -t .`

## Pendências conhecidas (herdadas do br-feriado-checker)
- `br_feriado_checker/core.py` usa uma API de feriados em `dict` e assinaturas
  `get_state_holidays(uf, year)` que divergem de `holidays.py` (dataclass `Holiday`,
  `get_state_holidays(year, state)`). 4 testes de `tests/test_core.py` falham por isso.
- Os dois pacotes ainda têm lógica de feriados duplicada (`feriado_br/holidays.py` e
  `br_feriado_checker/holidays.py`); unificar em um só.
