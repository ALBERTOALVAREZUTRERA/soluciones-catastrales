from __future__ import annotations

import io
import asyncio
import os
import tempfile
import sys
import subprocess
import unittest
import zipfile
import xml.etree.ElementTree as ET
import ezdxf
import shapefile
from shapely.geometry import Point, Polygon
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import (  # noqa: E402
    GenerateGMLRequest,
    _normalize_epsg,
    _stream_file_response,
    _validate_generation_request,
    analyze_file,
    app,
    generate_gml,
    generate_kml,
    generate_kmz,
    generate_dxf,
    generate_shape,
)
import main as main_module  # noqa: E402


class AnalyzeEndpointSecurityTests(unittest.IsolatedAsyncioTestCase):
    def _upload(self, filename: str, content: bytes) -> UploadFile:
        return UploadFile(file=io.BytesIO(content), filename=filename)

    async def test_debug_cors_endpoint_is_not_public(self):
        route_paths = {route.path for route in app.routes}

        self.assertNotIn("/debug-cors", route_paths)

    async def test_rejects_unsupported_epsg_before_processing(self):
        with self.assertRaises(HTTPException) as raised:
            await analyze_file(
                file=self._upload("parcela.dxf", b"contenido"),
                epsg="99999",
                tipo_entidad="CP",
            )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("EPSG", raised.exception.detail)

    async def test_rejects_empty_upload(self):
        with self.assertRaises(HTTPException) as raised:
            await analyze_file(
                file=self._upload("parcela.dxf", b""),
                epsg="25830",
                tipo_entidad="CP",
            )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("vacío", raised.exception.detail)

    async def test_rejects_oversized_upload(self):
        with patch.dict(os.environ, {"MAX_UPLOAD_BYTES": "5"}):
            with self.assertRaises(HTTPException) as raised:
                await analyze_file(
                    file=self._upload("parcela.dxf", b"123456"),
                    epsg="25830",
                    tipo_entidad="CP",
                )

        self.assertEqual(raised.exception.status_code, 413)

    async def test_rejects_zip_path_traversal(self):
        archive_data = io.BytesIO()
        with zipfile.ZipFile(archive_data, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("../escape.shp", b"contenido")

        with self.assertRaises(HTTPException) as raised:
            await analyze_file(
                file=self._upload(
                    "parcelas.zip",
                    archive_data.getvalue(),
                ),
                epsg="25830",
                tipo_entidad="CP",
            )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("ruta no permitida", raised.exception.detail)

    async def test_groups_a_hole_that_precedes_its_parent_in_the_dxf(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "parcel-with-hole.dxf"
            document = ezdxf.new("R2010")
            modelspace = document.modelspace()
            modelspace.add_lwpolyline(
                [(2, 2), (4, 2), (4, 4), (2, 4)],
                close=True,
                dxfattribs={"layer": "PG-LP"},
            )
            modelspace.add_lwpolyline(
                [(0, 0), (10, 0), (10, 10), (0, 10)],
                close=True,
                dxfattribs={"layer": "PG-LP"},
            )
            document.saveas(path)
            content = path.read_bytes()

        response = await analyze_file(
            file=self._upload("parcel-with-hole.dxf", content),
            epsg="25830",
            tipo_entidad="CP",
        )

        self.assertEqual(response.num_parcelas, 1)
        self.assertEqual(response.num_huecos, 1)
        self.assertAlmostEqual(response.parcelas[0].area, 96)

    async def test_preserves_the_cadastral_reference_from_the_original_filename(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.dxf"
            document = ezdxf.new("R2010")
            document.modelspace().add_lwpolyline(
                [(0, 0), (10, 0), (10, 10), (0, 10)],
                close=True,
                dxfattribs={"layer": "PG-LP"},
            )
            document.saveas(path)
            content = path.read_bytes()

        response = await analyze_file(
            file=self._upload("23039A04900005.dxf", content),
            epsg="25830",
            tipo_entidad="CP",
        )

        self.assertEqual(response.num_parcelas, 1)
        self.assertEqual(
            response.parcelas[0].referencia_catastral,
            "23039A04900005",
        )
        self.assertEqual(response.parcelas[0].id, "23039A04900005")


class GenerationRequestSecurityTests(unittest.TestCase):
    def test_rejects_empty_generation_request(self):
        request = GenerateGMLRequest(parcelas=[], epsg="25830")

        with self.assertRaises(HTTPException) as raised:
            _validate_generation_request(request)

        self.assertEqual(raised.exception.status_code, 400)

    def test_rejects_unsupported_generation_epsg(self):
        with self.assertRaises(HTTPException) as raised:
            _normalize_epsg("EPSG:99999")

        self.assertEqual(raised.exception.status_code, 400)

    def test_rejects_too_many_coordinates(self):
        request = GenerateGMLRequest(
            parcelas=[
                {
                    "coordenadas_utm": [[1, 2], [3, 4]],
                }
            ],
            epsg="25830",
        )

        with patch("main.MAX_GENERATION_POINTS", 1):
            with self.assertRaises(HTTPException) as raised:
                _validate_generation_request(request)

        self.assertEqual(raised.exception.status_code, 413)

    def test_rejects_missing_degenerate_and_non_finite_geometry(self):
        invalid_parcels = [
            {"area": 1},
            {"coordenadas_utm": [[0, 0], [1, 1], [0, 0]]},
            {"coordenadas_utm": [[0, 0], [1, 0], [0, float("nan")]]},
        ]

        for parcel in invalid_parcels:
            with self.subTest(parcel=parcel):
                with self.assertRaises(HTTPException) as raised:
                    _validate_generation_request(
                        GenerateGMLRequest(parcelas=[parcel], epsg="25830")
                    )
                self.assertEqual(raised.exception.status_code, 400)

    def test_rejects_invalid_latitude_and_negative_area(self):
        for parcel in [
            {
                "coordenadas_latlon": [[-3, 95], [-3.1, 40], [-3, 40.1]],
            },
            {
                "coordenadas_utm": [[0, 0], [1, 0], [0, 1]],
                "area": -1,
            },
        ]:
            with self.subTest(parcel=parcel):
                with self.assertRaises(HTTPException):
                    _validate_generation_request(
                        GenerateGMLRequest(parcelas=[parcel], epsg="25830")
                    )

    def test_rejects_invalid_building_floor_count(self):
        for floors in [0, 201, 1.5, True]:
            with self.subTest(floors=floors):
                with self.assertRaises(HTTPException) as raised:
                    _validate_generation_request(
                        GenerateGMLRequest(
                            parcelas=[{
                                "coordenadas_utm": [[0, 0], [1, 0], [0, 1]],
                                "numero_plantas": floors,
                            }],
                            epsg="25830",
                        )
                    )
                self.assertEqual(raised.exception.status_code, 400)

    def test_rejects_identifiers_that_collide_after_sanitizing(self):
        request = GenerateGMLRequest(
            parcelas=[
                {"id": "PARCELA-1", "coordenadas_utm": [[0, 0], [1, 0], [0, 1]]},
                {"id": "PARCELA1", "coordenadas_utm": [[2, 0], [3, 0], [2, 1]]},
            ],
            epsg="25830",
        )

        with self.assertRaises(HTTPException) as raised:
            _validate_generation_request(request)

        self.assertIn("identificadores únicos", raised.exception.detail)

    def test_rejects_two_property_references_from_the_same_parcel(self):
        request = GenerateGMLRequest(
            parcelas=[
                {
                    "referencia_catastral": "4067954VH2137S0001AB",
                    "coordenadas_utm": [[0, 0], [1, 0], [0, 1]],
                },
                {
                    "referencia_catastral": "4067954VH2137S0002CD",
                    "coordenadas_utm": [[2, 0], [3, 0], [2, 1]],
                },
            ],
            epsg="25830",
        )

        with self.assertRaises(HTTPException) as raised:
            _validate_generation_request(request)

        self.assertIn("identificadores únicos", raised.exception.detail)

    def test_rejects_oversized_identifiers_and_invalid_references(self):
        for parcel in [
            {
                "id": "X" * 101,
                "coordenadas_utm": [[0, 0], [1, 0], [0, 1]],
            },
            {
                "id": "PARCELA",
                "referencia_catastral": "NO-ES-UNA-RC",
                "coordenadas_utm": [[0, 0], [1, 0], [0, 1]],
            },
        ]:
            with self.subTest(parcel=parcel):
                with self.assertRaises(HTTPException) as raised:
                    _validate_generation_request(
                        GenerateGMLRequest(parcelas=[parcel], epsg="25830")
                    )
                self.assertEqual(raised.exception.status_code, 400)


class DownloadCleanupTests(unittest.IsolatedAsyncioTestCase):
    async def test_download_background_task_removes_temp_directory(self):
        with tempfile.TemporaryDirectory() as outer_temp:
            temp_dir = Path(outer_temp) / "generado"
            temp_dir.mkdir()
            file_path = temp_dir / "resultado.gml"
            file_path.write_bytes(b"<gml />")

            response = _stream_file_response(
                str(file_path),
                str(temp_dir),
                "application/gml+xml",
                'resultado"\r\nmalicioso.gml',
            )

            self.assertTrue(temp_dir.exists())
            self.assertNotIn("\r", response.headers["content-disposition"])
            self.assertNotIn("\n", response.headers["content-disposition"])

            await response.background()

            self.assertFalse(temp_dir.exists())


class ExportEndpointTests(unittest.IsolatedAsyncioTestCase):
    @staticmethod
    async def response_bytes(response):
        return b"".join([chunk async for chunk in response.body_iterator])

    @staticmethod
    def request_with_hole(area=999):
        return GenerateGMLRequest(
            parcelas=[{
                "id": "PARCELA_1",
                "referencia_catastral": "1234567AB1234C0001DE",
                "coordenadas_utm": [[0, 0], [10, 0], [10, 10], [0, 10]],
                "interiores_utm": [[[2, 2], [4, 2], [4, 4], [2, 4]]],
                "area": area,
            }],
            epsg="25830",
        )

    async def test_combines_multiple_parcels_in_one_gml(self):
        request = GenerateGMLRequest(
            parcelas=[
                {
                    "id": "PARCELA_1",
                    "coordenadas_utm": [[0, 0], [10, 0], [10, 10], [0, 10]],
                },
                {
                    "id": "PARCELA_2",
                    "coordenadas_utm": [[20, 0], [30, 0], [30, 10], [20, 10]],
                },
            ],
            epsg="25830",
        )

        response = await generate_gml(request)
        body = b"".join([chunk async for chunk in response.body_iterator])

        root = ET.fromstring(body)
        self.assertEqual(
            len(root.findall("{http://www.opengis.net/wfs/2.0}member")),
            2,
        )
        self.assertEqual(root.get("numberMatched"), "2")
        self.assertIn("parcelas_catastrales.gml", response.headers["content-disposition"])
        await response.background()

    async def test_kml_recalculates_area_and_preserves_holes(self):
        response = await generate_kml(self.request_with_hole())
        body = await self.response_bytes(response)
        root = ET.fromstring(body)

        self.assertEqual(
            len([node for node in root.iter() if node.tag.endswith("innerBoundaryIs")]),
            1,
        )
        descriptions = [
            node.text or ""
            for node in root.iter()
            if node.tag.endswith("description")
        ]
        self.assertTrue(any("96.00" in value for value in descriptions))
        await response.background()

    async def test_dxf_uses_cadastral_layers_and_places_label_inside(self):
        response = await generate_dxf(self.request_with_hole())
        body = await self.response_bytes(response)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "parcel.dxf"
            path.write_bytes(body)
            document = ezdxf.readfile(path)

        layers = {layer.dxf.name for layer in document.layers}
        self.assertTrue({"PG-LP", "PG-LI", "PG-LT"}.issubset(layers))
        modelspace = document.modelspace()
        self.assertEqual(len(modelspace.query('LWPOLYLINE[layer=="PG-LP"]')), 1)
        self.assertEqual(len(modelspace.query('LWPOLYLINE[layer=="PG-LI"]')), 1)
        label = list(modelspace.query('TEXT[layer=="PG-LT"]'))[0]
        position = label.dxf.insert
        exported_polygon = Polygon(
            [(0, 0), (10, 0), (10, 10), (0, 10)],
            [[(2, 2), (4, 2), (4, 4), (2, 4)]],
        )
        self.assertTrue(exported_polygon.contains(Point(position.x, position.y)))
        await response.background()

    async def test_shapefile_zip_is_complete_utf8_and_uses_real_area(self):
        response = await generate_shape(self.request_with_hole())
        body = await self.response_bytes(response)
        with tempfile.TemporaryDirectory() as directory:
            archive_path = Path(directory) / "parcel.zip"
            archive_path.write_bytes(body)
            with zipfile.ZipFile(archive_path) as archive:
                names = set(archive.namelist())
                self.assertEqual(
                    names,
                    {
                        "exportacion_catastral.shp",
                        "exportacion_catastral.shx",
                        "exportacion_catastral.dbf",
                        "exportacion_catastral.prj",
                        "exportacion_catastral.cpg",
                    },
                )
                self.assertEqual(archive.read("exportacion_catastral.cpg"), b"UTF-8")
                archive.extractall(directory)
            reader = shapefile.Reader(str(Path(directory) / "exportacion_catastral"))
            record = reader.record(0).as_dict()
            shape = reader.shape(0)
            reader.close()

        self.assertAlmostEqual(record["AREA"], 96)
        self.assertEqual(len(shape.parts), 2)
        part_starts = list(shape.parts) + [len(shape.points)]
        rings = [
            shape.points[start:end]
            for start, end in zip(part_starts, part_starts[1:])
        ]
        signed_areas = [
            sum(
                x1 * y2 - x2 * y1
                for (x1, y1), (x2, y2) in zip(ring, ring[1:])
            ) / 2
            for ring in rings
        ]
        self.assertLess(signed_areas[0], 0)
        self.assertGreater(signed_areas[1], 0)
        await response.background()

    async def test_export_rejects_hole_outside_exterior_as_client_error(self):
        request = GenerateGMLRequest(
            parcelas=[{
                "id": "INVALID",
                "coordenadas_utm": [[0, 0], [10, 0], [10, 10], [0, 10]],
                "interiores_utm": [[[20, 20], [22, 20], [22, 22], [20, 22]]],
            }],
            epsg="25830",
        )
        with self.assertRaises(HTTPException) as raised:
            await generate_kml(request)
        self.assertEqual(raised.exception.status_code, 400)

    async def test_kmz_uses_functional_generator_with_ring_structure(self):
        request = GenerateGMLRequest(
            parcelas=[{
                "id": "PARCELA",
                "coordenadas_utm": [[0, 0], [10, 0], [10, 10], [0, 10]],
                "interiores_utm": [[[2, 2], [4, 2], [4, 4], [2, 4]]],
                "area": 96,
            }],
            epsg="25830",
        )
        captured = {}

        def fake_generator(features, output_path, epsg):
            captured["features"] = features
            captured["epsg"] = epsg
            Path(output_path).write_bytes(b"KMZ")
            return output_path

        with patch("main.generate_kml_from_gml_features", side_effect=fake_generator):
            response = await generate_kmz(request)

        self.assertEqual(captured["epsg"], "25830")
        self.assertEqual(len(captured["features"][0]["geometry"]), 2)
        self.assertEqual(response.media_type, "application/vnd.google-earth.kmz")
        await response.background()


class ProductionConfigurationTests(unittest.TestCase):
    def test_production_requires_explicit_cors_origins(self):
        environment = os.environ.copy()
        environment["APP_ENV"] = "production"
        environment.pop("ADMITTED_ORIGINS", None)

        result = subprocess.run(
            [sys.executable, "-c", "import main"],
            cwd=BACKEND_DIR,
            env=environment,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ADMITTED_ORIGINS", result.stderr)

    def test_production_accepts_explicit_cors_origins(self):
        environment = os.environ.copy()
        environment["APP_ENV"] = "production"
        environment["ADMITTED_ORIGINS"] = "https://www.solucionescatastrales.app"

        result = subprocess.run(
            [sys.executable, "-c", "import main"],
            cwd=BACKEND_DIR,
            env=environment,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr)


class ApiObservabilityTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, raise_server_exceptions=False)

    def test_preserves_valid_request_id_on_http_errors(self):
        response = self.client.post(
            "/generate-gml",
            json={"parcelas": [], "epsg": "25830"},
            headers={"X-Request-ID": "backend-request-1234"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.headers["X-Request-ID"], "backend-request-1234")
        self.assertEqual(response.json()["code"], "invalid_request")
        self.assertEqual(response.json()["requestId"], "backend-request-1234")

    def test_replaces_invalid_request_id_and_normalizes_validation_errors(self):
        response = self.client.post(
            "/catastro/buscar-rc",
            json={},
            headers={"X-Request-ID": "bad"},
        )
        payload = response.json()

        self.assertEqual(response.status_code, 422)
        self.assertEqual(payload["code"], "validation_error")
        self.assertEqual(payload["error"], "Revise los datos enviados.")
        self.assertNotEqual(payload["requestId"], "bad")
        self.assertEqual(response.headers["X-Request-ID"], payload["requestId"])

    def test_internal_errors_do_not_expose_exception_details(self):
        with patch(
            "main.TaxCalculator.calculate",
            side_effect=RuntimeError("token-interno-super-secreto"),
        ):
            response = self.client.post(
                "/catastro/calcular-ibi",
                json={},
                headers={"X-Request-ID": "backend-request-5678"},
            )

        payload = response.json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(payload["code"], "internal_error")
        self.assertEqual(payload["requestId"], "backend-request-5678")
        self.assertNotIn("token-interno-super-secreto", response.text)

    def test_rejects_declared_oversized_body_before_parsing(self):
        response = self.client.post(
            "/generate-gml",
            content=b"{}",
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(main_module.MAX_JSON_REQUEST_BYTES + 1),
                "X-Request-ID": "backend-size-1234",
            },
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["code"], "payload_too_large")
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_returns_retryable_error_when_gis_capacity_is_exhausted(self):
        with (
            patch.object(main_module, "gis_job_slots", asyncio.Semaphore(0)),
            patch.object(main_module, "GIS_QUEUE_TIMEOUT_MS", 100),
        ):
            response = self.client.post(
                "/generate-gml",
                json={"parcelas": [], "epsg": "25830"},
                headers={"X-Request-ID": "backend-capacity-1234"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["code"], "capacity_exhausted")
        self.assertEqual(response.headers["Retry-After"], "2")
        self.assertEqual(response.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()
