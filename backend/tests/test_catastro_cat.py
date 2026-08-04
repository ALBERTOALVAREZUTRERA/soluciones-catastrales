import tempfile
import unittest
from pathlib import Path

from core.catastro_cat import (
    CatastroCatRepository,
    import_cat_to_sqlite,
    parse_cat_construction,
    parse_cat_property,
)


def cat_record(record_type: str, fields: list[tuple[int, int, str]]) -> str:
    characters = [" "] * 1000
    characters[0:2] = record_type
    for position, length, value in fields:
        encoded = value[:length].ljust(length)
        characters[position - 1:position - 1 + length] = encoded
    return "".join(characters)


PARCEL = "1234567AB1234C"
PROPERTY_RECORD = cat_record(
    "15",
    [
        (31, 14, PARCEL),
        (45, 4, "0001"),
        (49, 2, "AA"),
        (372, 4, "1972"),
        (428, 1, "V"),
        (442, 10, "71"),
    ],
)
CONSTRUCTION_RECORD = cat_record(
    "14",
    [
        (31, 14, PARCEL),
        (45, 4, "0001"),
        (51, 4, "0001"),
        (55, 4, "0001"),
        (71, 3, "V"),
        (74, 1, "E"),
        (75, 4, "1995"),
        (79, 4, "1972"),
        (84, 7, "71"),
        (105, 5, "01124"),
    ],
)


class CatastroCatParsingTests(unittest.TestCase):
    def test_parses_official_fixed_width_fields(self):
        reference, parcel, charge, age_year, surface, use = parse_cat_property(
            PROPERTY_RECORD
        )
        self.assertEqual(reference, f"{PARCEL}0001AA")
        self.assertEqual((parcel, charge, age_year, surface, use), (PARCEL, "0001", 1972, 71, "V"))

        construction = parse_cat_construction(CONSTRUCTION_RECORD)
        self.assertEqual(construction.reference, f"{PARCEL}0001")
        self.assertEqual(construction.destination, "V")
        self.assertEqual(construction.effective_year, 1972)
        self.assertEqual(construction.reform_type, "E")
        self.assertEqual(construction.reform_year, 1995)
        self.assertEqual(construction.typology_code, "0112")
        self.assertEqual(construction.category, 4)
        self.assertEqual(construction.urban_type_id, "AMC")

    def test_builds_index_and_finds_full_reference(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory, "municipio.CAT")
            database = Path(directory, "catastro.sqlite3")
            source.write_text(
                f"{PROPERTY_RECORD}\n{CONSTRUCTION_RECORD}\n",
                encoding="latin-1",
            )
            counts = import_cat_to_sqlite(source, database)
            self.assertEqual(counts, {"properties": 1, "constructions": 1})

            result = CatastroCatRepository(database).lookup(f"{PARCEL}0001AA")
            self.assertIsNotNone(result)
            self.assertEqual(result.built_surface, 71)
            self.assertEqual(result.dominant_construction.category, 4)
            self.assertEqual(result.dominant_construction.urban_type_id, "AMC")
            self.assertIsNone(CatastroCatRepository(database).lookup(PARCEL))


if __name__ == "__main__":
    unittest.main()
