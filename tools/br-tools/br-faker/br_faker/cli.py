import argparse
import json
import sys
from typing import Any

from br_faker.generators import (
    generate_address,
    generate_cnpj,
    generate_cpf,
    generate_email,
    generate_name,
    generate_person,
    generate_phone,
)


TYPES = ["cpf", "cnpj", "name", "email", "phone", "address", "person"]
OPTIONS = ["-n", "--quantity", "--unformatted", "--json", "--completion"]

COMPLETIONS = {
    "bash": f"""_br_faker() {{
  local cur="${{COMP_WORDS[COMP_CWORD]}}" prev="${{COMP_WORDS[COMP_CWORD-1]}}"
  if [[ "$prev" == "--completion" ]]; then
    COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
  elif [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "{' '.join(OPTIONS)}" -- "$cur"))
  else
    COMPREPLY=($(compgen -W "{' '.join(TYPES)}" -- "$cur"))
  fi
}}
complete -F _br_faker br-faker
""",
    "zsh": f"""#compdef br-faker
_arguments \\
  '(-n --quantity)'{{-n,--quantity}}'[number of items]:quantity' \\
  '--unformatted[raw unformatted digits]' \\
  '--json[output JSON]' \\
  '--completion[print a shell completion script]:shell:(bash zsh fish)' \\
  '1:type:({' '.join(TYPES)})'
""",
    "fish": f"""complete -c br-faker -f
complete -c br-faker -n __fish_is_first_arg -a "{' '.join(TYPES)}"
complete -c br-faker -s n -l quantity -r -d 'Number of items'
complete -c br-faker -l unformatted -d 'Raw unformatted digits'
complete -c br-faker -l json -d 'Output JSON'
complete -c br-faker -l completion -r -a "bash zsh fish" -d 'Print a shell completion script'
""",
}


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="br-faker",
        description="Command-line tool to generate realistic Brazilian fake data."
    )

    parser.add_argument(
        "type",
        nargs="?",
        choices=TYPES,
        help="Type of data to generate"
    )
    parser.add_argument(
        "--completion",
        choices=sorted(COMPLETIONS),
        help="Print a shell completion script (bash, zsh or fish) and exit"
    )
    parser.add_argument(
        "-n", "--quantity",
        type=int,
        default=1,
        help="Number of items to generate (default: 1)"
    )
    parser.add_argument(
        "--unformatted",
        action="store_true",
        help="Generate raw unformatted digits for CPF, CNPJ, phone"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output data in JSON format"
    )

    return parser


def main(args: list[str] | None = None) -> None:
    parser = create_parser()
    parsed_args = parser.parse_args(args)

    if parsed_args.completion:
        print(COMPLETIONS[parsed_args.completion], end="")
        return
    if parsed_args.type is None:
        parser.error("the following arguments are required: type")
    if parsed_args.quantity < 1:
        parser.error("Quantity (-n / --quantity) must be a positive integer greater than 0.")

    formatted = not parsed_args.unformatted
    results: list[Any] = []

    for _ in range(parsed_args.quantity):
        if parsed_args.type == "cpf":
            results.append(generate_cpf(formatted=formatted))
        elif parsed_args.type == "cnpj":
            results.append(generate_cnpj(formatted=formatted))
        elif parsed_args.type == "name":
            results.append(generate_name())
        elif parsed_args.type == "email":
            results.append(generate_email())
        elif parsed_args.type == "phone":
            results.append(generate_phone(formatted=formatted))
        elif parsed_args.type == "address":
            addr = generate_address()
            results.append(addr if parsed_args.json else f"{addr['street']}, {addr['number']} - {addr['city']}/{addr['state']} - CEP {addr['cep']}")
        elif parsed_args.type == "person":
            results.append(generate_person(formatted=formatted))

    if parsed_args.json:
        if parsed_args.quantity == 1:
            print(json.dumps(results[0], ensure_ascii=False, indent=2))
        else:
            print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for item in results:
            if isinstance(item, dict):
                print(json.dumps(item, ensure_ascii=False))
            else:
                print(item)


if __name__ == "__main__":
    main()
