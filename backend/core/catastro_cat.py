"""Lectura e indexación del formato oficial CAT de la DGC.

El formato CAT contiene datos descriptivos no protegidos. Este módulo solo
indexa los registros 14 (construcción) y 15 (inmueble) necesarios para
enriquecer la calculadora; no contiene titularidad ni valores catastrales.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from contextlib import closing
import os
from pathlib import Path
import sqlite3
from typing import Iterator, Optional


CAT_RECORD_LENGTH = 1000


CAT_TYPOLOGY_TO_URBAN_TYPE = {
    "0111": "AAP",  # Vivienda colectiva, edificación abierta
    "0112": "AMC",  # Vivienda colectiva, manzana cerrada
    "0121": "V",    # Vivienda unifamiliar, aislada o pareada
    "0122": "VMC",  # Vivienda unifamiliar, en línea/manzana cerrada
    "0211": "IAL",  # Nave de fabricación
    "0213": "AAL",  # Nave de almacenamiento
    "0221": "GAR",  # Garaje
    "0321": "OFI",  # Oficinas en edificio mixto
    "0411": "COM",  # Comercio en edificio mixto
    "0522": "KPS",  # Piscina descubierta
    "0611": "ESC",  # Espectáculos cubiertos
    "0711": "HOS",  # Hotel, hostal o motel
}


@dataclass(frozen=True)
class CatConstruction:
    reference: str
    parcel_reference: str
    charge: str
    unit_code: str
    sequence: int
    destination: str
    reform_type: Optional[str]
    reform_year: Optional[int]
    effective_year: Optional[int]
    surface: int
    typology_code: str
    category: Optional[int]
    urban_type_id: Optional[str]


@dataclass(frozen=True)
class CatProperty:
    reference: str
    parcel_reference: str
    charge: str
    age_year: Optional[int]
    built_surface: int
    use_code: str
    constructions: tuple[CatConstruction, ...]

    @property
    def dominant_construction(self) -> Optional[CatConstruction]:
        candidates = [item for item in self.constructions if item.surface > 0]
        return max(candidates, key=lambda item: item.surface, default=None)

    def to_public_dict(self) -> dict:
        dominant = self.dominant_construction
        return {
            "available": True,
            "source": "DGC_CAT",
            "reference": self.reference,
            "age_year": self.age_year,
            "built_surface": self.built_surface,
            "use_code": self.use_code,
            "dominant": asdict(dominant) if dominant else None,
            "constructions": [asdict(item) for item in self.constructions],
        }


def _integer(value: str) -> Optional[int]:
    stripped = value.strip()
    if not stripped or not stripped.isdigit():
        return None
    number = int(stripped)
    return number if number > 0 else None


def _record_chunks(raw_line: bytes) -> Iterator[bytes]:
    payload = raw_line.rstrip(b"\r\n")
    if not payload:
        return
    if len(payload) % CAT_RECORD_LENGTH != 0:
        raise ValueError(
            f"Registro CAT con longitud {len(payload)}; se esperaban bloques de 1000"
        )
    for offset in range(0, len(payload), CAT_RECORD_LENGTH):
        yield payload[offset:offset + CAT_RECORD_LENGTH]


def iter_cat_records(path: str | os.PathLike[str]) -> Iterator[str]:
    """Itera registros CAT con o sin saltos de línea, conservando posiciones."""
    with open(path, "rb") as stream:
        for raw_line in stream:
            for chunk in _record_chunks(raw_line):
                yield chunk.decode("latin-1")


def parse_cat_construction(record: str) -> CatConstruction:
    if len(record) != CAT_RECORD_LENGTH or record[:2] != "14":
        raise ValueError("El registro no es una construcción CAT tipo 14")
    parcel = record[30:44].strip().upper()
    charge = record[50:54].strip().zfill(4)
    raw_typology = record[104:109].strip()
    category = int(raw_typology[-1]) if len(raw_typology) == 5 and raw_typology[-1].isdigit() else None
    typology_code = raw_typology[:4] if len(raw_typology) >= 4 else raw_typology
    reform_type = record[73:74].strip().upper() or None
    return CatConstruction(
        reference=f"{parcel}{charge}",
        parcel_reference=parcel,
        charge=charge,
        unit_code=record[54:58].strip(),
        sequence=int(record[44:48].strip() or 0),
        destination=record[70:73].strip().upper(),
        reform_type=reform_type,
        reform_year=_integer(record[74:78]),
        effective_year=_integer(record[78:82]),
        surface=_integer(record[83:90]) or 0,
        typology_code=typology_code,
        category=category if category and 1 <= category <= 9 else None,
        urban_type_id=CAT_TYPOLOGY_TO_URBAN_TYPE.get(typology_code),
    )


def parse_cat_property(record: str) -> tuple[str, str, str, Optional[int], int, str]:
    if len(record) != CAT_RECORD_LENGTH or record[:2] != "15":
        raise ValueError("El registro no es un inmueble CAT tipo 15")
    parcel = record[30:44].strip().upper()
    charge = record[44:48].strip().zfill(4)
    control = record[48:50].strip().upper()
    return (
        f"{parcel}{charge}{control}",
        parcel,
        charge,
        _integer(record[371:375]),
        _integer(record[441:451]) or 0,
        record[427:428].strip().upper(),
    )


def import_cat_to_sqlite(
    cat_path: str | os.PathLike[str],
    database_path: str | os.PathLike[str],
) -> dict[str, int]:
    """Crea de forma reproducible un índice SQLite consultable por RC."""
    source = Path(cat_path)
    destination = Path(database_path)
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        destination.unlink()

    property_count = 0
    construction_count = 0
    with closing(sqlite3.connect(destination)) as connection:
        connection.executescript(
            """
            PRAGMA journal_mode = DELETE;
            CREATE TABLE properties (
                rc20 TEXT PRIMARY KEY,
                rc18 TEXT NOT NULL UNIQUE,
                parcel_rc14 TEXT NOT NULL,
                charge TEXT NOT NULL,
                age_year INTEGER,
                built_surface INTEGER NOT NULL,
                use_code TEXT NOT NULL
            );
            CREATE TABLE constructions (
                rc18 TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                unit_code TEXT NOT NULL,
                destination TEXT NOT NULL,
                reform_type TEXT,
                reform_year INTEGER,
                effective_year INTEGER,
                surface INTEGER NOT NULL,
                typology_code TEXT NOT NULL,
                category INTEGER,
                urban_type_id TEXT,
                PRIMARY KEY (rc18, sequence)
            );
            CREATE INDEX constructions_reference_idx ON constructions(rc18);
            """
        )
        for record in iter_cat_records(source):
            if record[:2] != "15":
                continue
            rc20, parcel, charge, age_year, built_surface, use_code = parse_cat_property(record)
            connection.execute(
                "INSERT OR REPLACE INTO properties VALUES (?, ?, ?, ?, ?, ?, ?)",
                (rc20, rc20[:18], parcel, charge, age_year, built_surface, use_code),
            )
            property_count += 1

        for record in iter_cat_records(source):
            if record[:2] != "14":
                continue
            item = parse_cat_construction(record)
            connection.execute(
                """
                INSERT OR REPLACE INTO constructions
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.reference,
                    item.sequence,
                    item.unit_code,
                    item.destination,
                    item.reform_type,
                    item.reform_year,
                    item.effective_year,
                    item.surface,
                    item.typology_code,
                    item.category,
                    item.urban_type_id,
                ),
            )
            construction_count += 1
        connection.commit()

    return {"properties": property_count, "constructions": construction_count}


class CatastroCatRepository:
    def __init__(self, database_path: str | os.PathLike[str]):
        self.database_path = Path(database_path)

    def lookup(self, reference: str) -> Optional[CatProperty]:
        normalized = "".join(reference.split()).upper()
        if len(normalized) not in (18, 20) or not normalized.isalnum():
            return None
        if not self.database_path.is_file():
            return None
        rc18 = normalized[:18]
        with closing(sqlite3.connect(self.database_path)) as connection:
            row = connection.execute(
                """
                SELECT rc20, parcel_rc14, charge, age_year, built_surface, use_code
                FROM properties WHERE rc18 = ?
                """,
                (rc18,),
            ).fetchone()
            if not row:
                return None
            construction_rows = connection.execute(
                """
                SELECT sequence, unit_code, destination, reform_type, reform_year,
                       effective_year, surface, typology_code, category, urban_type_id
                FROM constructions WHERE rc18 = ? ORDER BY sequence
                """,
                (rc18,),
            ).fetchall()

        constructions = tuple(
            CatConstruction(
                reference=rc18,
                parcel_reference=row[1],
                charge=row[2],
                sequence=item[0],
                unit_code=item[1],
                destination=item[2],
                reform_type=item[3],
                reform_year=item[4],
                effective_year=item[5],
                surface=item[6],
                typology_code=item[7],
                category=item[8],
                urban_type_id=item[9],
            )
            for item in construction_rows
        )
        return CatProperty(
            reference=row[0],
            parcel_reference=row[1],
            charge=row[2],
            age_year=row[3],
            built_surface=row[4],
            use_code=row[5],
            constructions=constructions,
        )


def get_cat_enrichment(reference: str) -> Optional[dict]:
    database_path = os.getenv("CATASTRO_CAT_DB_PATH", "").strip()
    if not database_path:
        return None
    result = CatastroCatRepository(database_path).lookup(reference)
    return result.to_public_dict() if result else None
