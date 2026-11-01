"""Module entrypoint for python -m cep_lookup."""

import sys
from cep_lookup.cli import main

if __name__ == "__main__":
    sys.exit(main())
