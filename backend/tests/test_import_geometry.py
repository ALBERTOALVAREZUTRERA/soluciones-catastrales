import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import ezdxf

from core.conflict_detector import ConflictDetector
from core.dxf_reader import DXFReader
from core.kml_reader import KMLReader
from core.parcel_model import ParcelaInfo
from core.shp_reader import SHPReader


def parcel(exterior, interiors=None, layer=""):
    return ParcelaInfo(
        coordenadas=exterior,
        interiores=interiors or [],
        capa_origen=layer,
    )


class DxfImportTests(unittest.TestCase):
    def _write_dxf(self, points, close):
        directory = tempfile.TemporaryDirectory()
        path = Path(directory.name) / "parcel.dxf"
        document = ezdxf.new()
        document.modelspace().add_lwpolyline(points, close=close)
        document.saveas(path)
        return directory, path

    def test_rejects_open_polyline_with_distant_endpoints(self):
        directory, path = self._write_dxf([(0, 0), (10, 0), (10, 10)], False)
        with directory:
            self.assertEqual(DXFReader.leer_borde_parcelas(str(path), ["0"], ""), [])

    def test_accepts_declared_closed_polyline(self):
        directory, path = self._write_dxf(
            [(0, 0), (10, 0), (10, 10), (0, 10)], True
        )
        with directory:
            result = DXFReader.leer_borde_parcelas(str(path), ["0"], "")
        self.assertEqual(len(result), 1)
        self.assertAlmostEqual(result[0].area, 100)
        self.assertEqual(result[0].coordenadas[0], result[0].coordenadas[-1])

    def test_nesting_requires_the_whole_child_to_be_inside(self):
        parent = parcel([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
        crossing = parcel([(8, 2), (12, 2), (12, 4), (8, 4), (8, 2)])
        self.assertEqual(DXFReader.detect_nesting([parent, crossing]), {})

    def test_nesting_alternates_holes_and_islands_by_depth(self):
        outer = parcel([(0, 0), (20, 0), (20, 20), (0, 20), (0, 0)])
        inner_parent = parcel([(2, 2), (18, 2), (18, 18), (2, 18), (2, 2)])
        child = parcel([(4, 4), (6, 4), (6, 6), (4, 6), (4, 4)])
        self.assertEqual(DXFReader.detect_nesting([outer, inner_parent, child]), {0: [1]})

    def test_cleanup_subtracts_holes_and_rejects_split_repairs(self):
        with_hole = parcel(
            [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)],
            [[(2, 2), (4, 2), (4, 4), (2, 4), (2, 2)]],
        )
        DXFReader.limpiar_topologia([with_hole])
        self.assertAlmostEqual(with_hole.area, 96)

        bow_tie = parcel([(0, 0), (2, 2), (0, 2), (2, 0), (0, 0)])
        with self.assertRaisesRegex(ValueError, "sin dividirse"):
            DXFReader.limpiar_topologia([bow_tie])


class ConflictDetectionTests(unittest.TestCase):
    def test_containment_is_a_conflict_when_not_encoded_as_a_hole(self):
        outer = parcel([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
        contained = parcel([(2, 2), (4, 2), (4, 4), (2, 4), (2, 2)])
        ConflictDetector.detectar_conflictos([outer, contained])
        self.assertTrue(outer.has_conflict)
        self.assertTrue(contained.has_conflict)

    def test_polygon_inside_an_actual_hole_is_not_a_conflict(self):
        outer = parcel(
            [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)],
            [[(3, 3), (7, 3), (7, 7), (3, 7), (3, 3)]],
        )
        island = parcel([(4, 4), (6, 4), (6, 6), (4, 6), (4, 4)])
        ConflictDetector.detectar_conflictos([outer, island])
        self.assertFalse(outer.has_conflict)
        self.assertFalse(island.has_conflict)


class KmlImportTests(unittest.TestCase):
    def test_reads_namespaced_polygon_with_hole(self):
        kml = """<?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark>
          <name>1234567AB1234CDEFG</name><Polygon>
            <outerBoundaryIs><LinearRing><coordinates>
              -3.7040,40.4160 -3.7030,40.4160 -3.7030,40.4170 -3.7040,40.4170 -3.7040,40.4160
            </coordinates></LinearRing></outerBoundaryIs>
            <innerBoundaryIs><LinearRing><coordinates>
              -3.7038,40.4162 -3.7036,40.4162 -3.7036,40.4164 -3.7038,40.4164 -3.7038,40.4162
            </coordinates></LinearRing></innerBoundaryIs>
          </Polygon></Placemark></Document></kml>"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "parcel.kml"
            path.write_text(kml, encoding="utf-8")
            result = KMLReader.leer_kml(str(path), "25830")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].referencia_catastral, "1234567AB1234CDEFG")
        self.assertEqual(len(result[0].interiores), 1)
        self.assertGreater(result[0].area, 0)

    def test_rejects_incomplete_or_out_of_range_coordinates(self):
        with self.assertRaises(ValueError):
            KMLReader._parse_coordinates("-3.7,40.4 broken")
        with self.assertRaises(ValueError):
            KMLReader._parse_coordinates("181,40.4")


class ShapefileArchiveTests(unittest.TestCase):
    def test_requires_the_mandatory_sidecar_files(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "parcel.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("parcel.shp", b"dummy")
            with self.assertRaisesRegex(ValueError, "faltan"):
                SHPReader.leer_desde_zip(str(archive))

    def test_accepts_uppercase_sidecar_extensions(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "parcel.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("PARCEL.SHP", b"dummy")
                output.writestr("PARCEL.SHX", b"dummy")
                output.writestr("PARCEL.DBF", b"dummy")
            with patch.object(SHPReader, "leer_shp", return_value=[]) as reader:
                self.assertEqual(SHPReader.leer_desde_zip(str(archive)), [])
                reader.assert_called_once()


if __name__ == "__main__":
    unittest.main()
