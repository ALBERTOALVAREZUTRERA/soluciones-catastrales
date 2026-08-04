import tempfile
import unittest
from pathlib import Path

from lxml import etree

from core.building_generator import BuildingGenerator
from core.gml_generator import GMLGenerator
from core.parcel_model import ParcelaInfo


class ParcelGmlGenerationTests(unittest.TestCase):
    def test_uses_correct_urban_and_rustic_labels(self):
        self.assertEqual(GMLGenerator.cadastral_parcel_label("4067954VH2137S"), "54")
        self.assertEqual(GMLGenerator.cadastral_parcel_label("23039A04900005"), "5")
        self.assertEqual(GMLGenerator.cadastral_parcel_label("PARCELA_LOCAL"), "")

    def test_reduces_a_property_reference_to_its_fourteen_character_parcel(self):
        parcel = ParcelaInfo(
            referencia_catastral="4067954VH2137S0001AB",
            coordenadas=[[0, 0], [10, 0], [10, 10], [0, 10]],
        )
        with tempfile.TemporaryDirectory() as directory:
            path = GMLGenerator.generar_gml(parcel, directory)
            document = etree.parse(path)

        self.assertEqual(
            document.xpath("string(//*[local-name()='localId'])"),
            "4067954VH2137S",
        )
        self.assertEqual(
            document.xpath("string(//*[local-name()='nationalCadastralReference'])"),
            "4067954VH2137S",
        )
        self.assertEqual(document.xpath("string(//*[local-name()='label'])"), "54")

    def test_local_parcel_does_not_invent_a_national_reference(self):
        parcel = ParcelaInfo(
            nombre_archivo="finca local",
            coordenadas=[[0, 0], [10, 0], [10, 10], [0, 10]],
        )
        with tempfile.TemporaryDirectory() as directory:
            path = GMLGenerator.generar_gml(parcel, directory)
            document = etree.parse(path)

        self.assertEqual(
            document.xpath("string(//*[local-name()='namespace'])"),
            "ES.LOCAL.CP",
        )
        references = document.xpath(
            "//*[local-name()='nationalCadastralReference']"
        )
        self.assertEqual(len(references), 1)
        self.assertIsNone(references[0].text)

    def test_recalculates_area_closes_rings_and_uses_requested_epsg(self):
        exterior = [
            [500000, 4200000],
            [500000, 4200010],
            [500010, 4200010],
            [500010, 4200000],
        ]
        original = [point[:] for point in exterior]
        parcel = ParcelaInfo(
            nombre_archivo="parcela prueba",
            area=999,
            coordenadas=exterior,
            interiores=[[
                [500002, 4200002],
                [500004, 4200002],
                [500004, 4200004],
                [500002, 4200004],
            ]],
        )

        with tempfile.TemporaryDirectory() as directory:
            path = GMLGenerator.generar_gml(parcel, directory, epsg_code="25831")
            document = etree.parse(path)

        self.assertEqual(exterior, original)
        self.assertEqual(parcel.area, 96)
        self.assertEqual(
            document.xpath("string(//*[local-name()='areaValue'])"),
            "96",
        )
        srs_names = document.xpath("//@srsName")
        self.assertTrue(srs_names)
        self.assertTrue(all(name.endswith("::25831") for name in srs_names))
        counts = document.xpath("//*[local-name()='posList']/@count")
        self.assertEqual(counts, ["5", "5"])

    def test_rejects_self_intersections_and_external_holes(self):
        with self.assertRaisesRegex(ValueError, "no es válida|superficie nula"):
            GMLGenerator.prepare_polygon(
                [[0, 0], [10, 10], [0, 10], [10, 0]],
            )
        with self.assertRaisesRegex(ValueError, "no es válida"):
            GMLGenerator.prepare_polygon(
                [[0, 0], [10, 0], [10, 10], [0, 10]],
                [[[20, 20], [22, 20], [22, 22], [20, 22]]],
            )


class BuildingGmlGenerationTests(unittest.TestCase):
    @staticmethod
    def signed_area(pos_list):
        values = [float(value) for value in pos_list.split()]
        points = list(zip(values[::2], values[1::2]))
        return sum(
            x1 * y2 - x2 * y1
            for (x1, y1), (x2, y2) in zip(points, points[1:])
        ) / 2

    def test_preserves_multiple_footprints_and_requested_epsg(self):
        building = ParcelaInfo(
            nombre_archivo="edificio",
            referencia_catastral="1234567AB1234C0001DE",
            numero_plantas=3,
        )
        building.partes = [
            {
                "exterior": [[0, 0], [5, 0], [5, 5], [0, 5]],
                "huecos": [[[1, 1], [2, 1], [2, 2], [1, 2]]],
            },
            {
                "exterior": [[10, 0], [15, 0], [15, 5], [10, 5]],
                "huecos": [],
            },
        ]

        with tempfile.TemporaryDirectory() as directory:
            path = BuildingGenerator.generar_gml_edificio(
                building,
                directory,
                "25829",
            )
            self.assertTrue(Path(path).exists())
            document = etree.parse(path)

        self.assertEqual(
            len(document.xpath("//*[local-name()='PolygonPatch']")),
            2,
        )
        srs_names = document.xpath("//@srsName")
        self.assertTrue(srs_names)
        self.assertTrue(all(name.endswith("::25829") for name in srs_names))
        self.assertEqual(
            document.xpath("string(//*[local-name()='namespace'])"),
            "ES.LOCAL.BU",
        )
        self.assertEqual(
            document.xpath("string(//*[local-name()='numberOfFloorsAboveGround'])"),
            "3",
        )
        exterior_pos_lists = document.xpath(
            "//*[local-name()='exterior']//*[local-name()='posList']/text()"
        )
        interior_pos_lists = document.xpath(
            "//*[local-name()='interior']//*[local-name()='posList']/text()"
        )
        self.assertTrue(all(self.signed_area(ring) < 0 for ring in exterior_pos_lists))
        self.assertTrue(all(self.signed_area(ring) > 0 for ring in interior_pos_lists))


if __name__ == "__main__":
    unittest.main()
