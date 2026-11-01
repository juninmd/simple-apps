# feriado-br-cli

A command‑line tool and Python library that lists Brazil's national, state, and municipal holidays for a given year, with optional filtering by state, municipality/city, holiday type, and JSON output formatting.

Developers, HR professionals, and travelers can quickly check holiday dates for scheduling, payroll, or travel planning.

## Features

- **National Holidays**: Fixed and moveable national holidays (Carnaval, Sexta-Feira Santa, Corpus Christi).
- **State Holidays**: Support for holidays across all 26 Brazilian states and the Federal District (DF).
- **Municipal Holidays**: Support for municipal holidays in major cities (e.g., São Paulo, Rio de Janeiro, Belo Horizonte, Salvador, Recife, Curitiba, Porto Alegre, Fortaleza, Brasilia).
- **Flexible Filters**: Filter by state code (`-s` / `--state`), municipality/city name (`-c` / `--city` or `--municipality`), and holiday type (`-t` / `--type`).
- **JSON Output**: Produce JSON output (`-j` / `--json`) for easy programmatic integration.

## Installation

```bash
pip install .
```

or run directly via Python:

```bash
python3 -m feriado_br.cli [options]
```

## Usage

```bash
feriado-br [YEAR] [OPTIONS]
```

### Options

- `YEAR`: Year to retrieve holidays for (e.g., `2026`). Defaults to current year.
- `-y, --year YEAR`: Specific year to retrieve holidays for.
- `-s, --state STATE`: Filter by state UF code (e.g., `SP`, `RJ`, `MG`).
- `-c, --city CITY`, `--municipality CITY`: Filter by city/municipality name (e.g., `"São Paulo"`, `"Rio de Janeiro"`).
- `-t, --type {national,state,municipal,all}`: Filter by holiday type.
- `-n, --next`: Show only the next upcoming holiday (today included), ignoring the year.
- `-j, --json`: Output results in JSON format.
- `-h, --help`: Show help message.

### Examples

List all national holidays for 2026:
```bash
feriado-br 2026 -t national
```

List national and state holidays for São Paulo in 2026:
```bash
feriado-br 2026 -s SP
```

List all holidays (national, state, municipal) for São Paulo city in 2026 in JSON format:
```bash
feriado-br 2026 -s SP -c "São Paulo" -j
```

List municipal holidays for Rio de Janeiro:
```bash
feriado-br 2026 -s RJ -c "Rio de Janeiro" -t municipal
```

Show the next upcoming holiday in São Paulo:
```bash
feriado-br --next -s SP
```

## Python Library API

```python
from feriado_br import get_holidays

# Get all holidays for São Paulo in 2026
holidays = get_holidays(2026, state="SP", city="São Paulo")

for h in holidays:
    print(h.date, h.name, h.type, h.location)
```

## License

MIT
