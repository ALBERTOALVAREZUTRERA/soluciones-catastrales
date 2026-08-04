"""Importa un fichero oficial CAT a un índice SQLite para la API."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from core.catastro_cat import import_cat_to_sqlite


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Indexa datos descriptivos CAT sin titularidad ni valores protegidos."
    )
    parser.add_argument("cat_file", type=Path, help="Fichero CAT oficial")
    parser.add_argument("database", type=Path, help="SQLite de salida")
    args = parser.parse_args()
    counts = import_cat_to_sqlite(args.cat_file, args.database)
    print(json.dumps({"database": str(args.database), **counts}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
