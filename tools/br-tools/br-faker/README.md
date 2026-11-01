# br-faker

A command-line tool that generates realistic Brazilian fake data such as names, CPF, CNPJ, phone numbers, emails, and addresses. Developers and QA engineers can use it to quickly create test data, seed databases, or fill forms without relying on external services.

## Installation

```bash
pip install .
```

## Usage

Generate Brazilian test data directly from the command line:

```bash
br-faker <type> [options]
```

### Supported Data Types

- `cpf` - Brazilian CPF numbers
- `cnpj` - Brazilian CNPJ numbers
- `name` - Full Brazilian names
- `email` - Email addresses matching names
- `phone` - Brazilian phone numbers with DDD
- `address` - Brazilian address
- `person` - Complete person profile (name, CPF, email, phone, address)

### Options

- `-n, --quantity <N>`: Generate N items in batch mode (default: 1).
- `--unformatted`: Output raw unformatted digits for CPF, CNPJ, and phone numbers.
- `--json`: Output data formatted as JSON. In batch mode (`-n > 1`), outputs a JSON array.

### Examples

Generate a single CPF:
```bash
br-faker cpf
```

Generate 5 CPFs in batch mode:
```bash
br-faker cpf -n 5
```

Generate 3 unformatted CNPJs:
```bash
br-faker cnpj --quantity 3 --unformatted
```

Generate 10 person records formatted as a JSON array:
```bash
br-faker person -n 10 --json
```
