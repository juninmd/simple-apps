# cep-lookup-cli

A command-line tool that lets developers and users quickly look up Brazilian postal codes (CEP) and retrieve full address details via the free ViaCEP API. It supports batch mode, accepting multiple CEPs via positional command-line arguments or standard input (stdin), and outputting aggregated results in human-readable or JSON format.

## Features
- **Batch Processing**: Look up multiple CEPs concurrently.
- **Multiple Inputs**: Pass CEPs as command-line arguments or pipe them via `stdin`.
- **Flexible Output**: Display structured formatted text or raw JSON (`-j` / `--json`).
- **Resilient**: Gracefully handles invalid formats, network issues, and not-found CEPs.

## Installation

```bash
pip install .
```

Or run directly using python:

```bash
python3 -m cep_lookup <CEPs...>
```

## Usage

### 1. Lookup CEPs via Arguments

You can pass one or more CEPs directly as arguments:

```bash
python3 -m cep_lookup 01001-000 20040-002
```

### 2. Lookup CEPs via Standard Input (stdin)

Pipe CEPs into the CLI (separated by newlines, spaces, or commas):

```bash
echo "01001-000 20040-002" | python3 -m cep_lookup
```

or from a file containing CEPs:

```bash
cat ceps.txt | python3 -m cep_lookup
```

### 3. JSON Output Mode

To receive JSON-formatted aggregated results (useful for scripting and integration):

```bash
python3 -m cep_lookup 01001-000 20040-002 --json
```

Output example:

```json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "cep": "01001-000",
      "success": true,
      "error": null,
      "data": {
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
      }
    },
    ...
  ]
}
```

### 4. Custom Concurrency Worker Count

Use the `-w` or `--workers` flag to specify maximum concurrent worker threads (default: 5):

```bash
python3 -m cep_lookup 01001-000 20040-002 -w 10
```

## Running Tests

Run unit tests using Python's built-in `unittest`:

```bash
python3 -m unittest discover -s tests
```
