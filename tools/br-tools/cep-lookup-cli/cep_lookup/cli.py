"""CLI interface for CEP lookup tool."""

import argparse
import json
import sys
from typing import List, Optional

from cep_lookup.batch import read_ceps_from_stdin, fetch_ceps_batch, summarize_batch_results


def parse_args(args: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="cep-lookup",
        description="Look up Brazilian postal codes (CEP) via ViaCEP API in batch mode or single mode."
    )
    parser.add_argument(
        "ceps",
        nargs="*",
        help="One or more CEP codes to look up. If empty, reads from standard input (stdin)."
    )
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output aggregate results as formatted JSON."
    )
    parser.add_argument(
        "-w", "--workers",
        type=int,
        default=5,
        help="Maximum concurrent workers for batch lookup (default: 5)."
    )
    return parser.parse_args(args)


def format_text_results(summary: dict) -> str:
    lines = []
    lines.append(f"Batch CEP Lookup Results ({summary['successful']}/{summary['total']} successful):")
    lines.append("=" * 60)
    for res in summary["results"]:
        cep = res["cep"]
        if res["success"]:
            data = res["data"]
            addr_parts = [
                data.get("logradouro"),
                data.get("bairro"),
                f"{data.get('localidade')}-{data.get('uf')}"
            ]
            addr_str = ", ".join(p for p in addr_parts if p)
            lines.append(f"✓ {cep}: {data.get('cep')} - {addr_str}")
        else:
            lines.append(f"✗ {cep}: Error: {res['error']}")
    lines.append("=" * 60)
    return "\n".join(lines)


def main(args: Optional[List[str]] = None) -> int:
    parsed_args = parse_args(args)

    ceps_to_lookup = list(parsed_args.ceps) if parsed_args.ceps else []

    if not ceps_to_lookup:
        stdin_ceps = read_ceps_from_stdin()
        ceps_to_lookup.extend(stdin_ceps)

    if not ceps_to_lookup:
        sys.stderr.write("Error: No CEPs provided as positional arguments or via stdin.\n")
        return 1

    results = fetch_ceps_batch(ceps_to_lookup, max_workers=parsed_args.workers)
    summary = summarize_batch_results(results)

    if parsed_args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(format_text_results(summary))

    if summary["failed"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
