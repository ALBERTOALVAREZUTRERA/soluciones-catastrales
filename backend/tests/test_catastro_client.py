import unittest
import xml.etree.ElementTree as ET
from unittest.mock import patch

from fastapi import HTTPException

from core.catastro_client import (
    CatastroUpstreamError,
    cadastral_reference_from,
    catastro_error,
    normalize_cadastral_reference,
)
from main import (
    BuscarCoordsRequest,
    BuscarRCRequest,
    BuscarRusticaRequest,
    buscar_parcela_rustica,
    buscar_por_coordenadas,
    buscar_por_referencia_catastral,
)


PROPERTY_XML = b"""
<consulta_dnp xmlns="http://www.catastro.meh.es/">
  <control><cudnp>1</cudnp></control>
  <bico>
    <bi>
      <idbi><cn>UR</cn><rc><pc1>2749704</pc1><pc2>YJ0624N</pc2><car>0001</car><cc1>D</cc1><cc2>I</cc2></rc></idbi>
      <dt><np>VALENCIA</np><nm>GODELLETA</nm></dt>
      <ldt>CL GUAYANA 3</ldt>
      <debi><luso>Residencial</luso><sfc>94</sfc><ant>1976</ant></debi>
    </bi>
    <finca><dff><ss>839</ss></dff></finca>
  </bico>
</consulta_dnp>
"""

COORDINATE_XML = b"""
<consulta_coordenadas xmlns="http://www.catastro.meh.es/">
  <control><cucoor>1</cucoor><cuerr>0</cuerr></control>
  <coordenadas><coord>
    <pc><pc1>2749704</pc1><pc2>YJ0624N</pc2></pc>
    <geo><xcen>-0.6452626</xcen><ycen>39.4080401</ycen><srs>EPSG:4326</srs></geo>
    <ldt>CL GUAYANA 3</ldt>
  </coord></coordenadas>
</consulta_coordenadas>
"""

ANDUJAR_PROPERTY_XML = PROPERTY_XML.replace(
    b"<np>VALENCIA</np><nm>GODELLETA</nm>",
    b"<np>JAEN</np><nm>ANDUJAR</nm>",
)


class CatastroXmlTests(unittest.TestCase):
    def test_normalizes_only_supported_reference_lengths(self):
        self.assertEqual(
            normalize_cadastral_reference("2749704 yj0624n 0001 di"),
            "2749704YJ0624N0001DI",
        )
        for invalid in ["", "123", "123456789012345", "1234567890123!"]:
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    normalize_cadastral_reference(invalid)

    def test_reads_namespaced_reference_and_error(self):
        root = ET.fromstring(PROPERTY_XML)
        self.assertEqual(
            cadastral_reference_from(root, full=True),
            "2749704YJ0624N0001DI",
        )
        error_root = ET.fromstring(
            b"<r><control><cuerr>1</cuerr></control>"
            b"<lerr><err><cod>9</cod><des>NO EXISTE</des></err></lerr></r>"
        )
        self.assertEqual(catastro_error(error_root), "NO EXISTE")


class CatastroEndpointTests(unittest.TestCase):
    @patch(
        "main.get_cat_enrichment",
        return_value={
            "available": True,
            "source": "DGC_CAT",
            "age_year": 1972,
            "built_surface": 94,
            "dominant": {
                "urban_type_id": "AMC",
                "typology_code": "0112",
                "category": 4,
                "effective_year": 1972,
                "reform_type": None,
                "reform_year": None,
            },
        },
    )
    @patch("main.TaxCalculator.get_valuation_zone", return_value="R43")
    @patch("main.get_coordinates", return_value=ET.fromstring(COORDINATE_XML))
    @patch("main.get_property", return_value=ET.fromstring(ANDUJAR_PROPERTY_XML))
    def test_reference_lookup_prefers_official_cat_construction_details(
        self,
        _property,
        _coordinates,
        _valuation,
        _cat,
    ):
        result = buscar_por_referencia_catastral(
            BuscarRCRequest(referencia_catastral="2749704YJ0624N0001DI")
        )
        self.assertEqual(result["datos_constructivos_fuente"], "DGC_CAT")
        self.assertEqual(result["tipologia_constructiva"], "AMC")
        self.assertEqual(result["categoria_constructiva"], 4)
        self.assertEqual(result["anio_const"], 1972)

    @patch("main.TaxCalculator.get_valuation_zone", return_value=None)
    @patch("main.get_coordinates", return_value=ET.fromstring(COORDINATE_XML))
    @patch("main.get_property", return_value=ET.fromstring(PROPERTY_XML))
    def test_reference_lookup_returns_structured_property(
        self,
        _property,
        _coordinates,
        _valuation,
    ):
        result = buscar_por_referencia_catastral(
            BuscarRCRequest(referencia_catastral="2749704YJ0624N0001DI")
        )

        self.assertTrue(result["encontrado"])
        self.assertEqual(result["rc"], "2749704YJ0624N0001DI")
        self.assertEqual(result["superficie_parcela"], 839)
        self.assertEqual(result["superficie_construida"], 94)
        self.assertEqual(result["anio_const"], 1976)
        self.assertAlmostEqual(result["lat"], 39.4080401)
        self.assertAlmostEqual(result["lon"], -0.6452626)

    def test_reference_lookup_rejects_invalid_characters(self):
        with self.assertRaises(HTTPException) as raised:
            buscar_por_referencia_catastral(
                BuscarRCRequest(referencia_catastral="1234567890123!")
            )
        self.assertEqual(raised.exception.status_code, 400)

    @patch("main.TaxCalculator.get_valuation_zone", return_value=None)
    @patch("main.get_coordinates", return_value=ET.fromstring(COORDINATE_XML))
    @patch("main.get_property", return_value=ET.fromstring(ANDUJAR_PROPERTY_XML))
    def test_andujar_never_invents_a_zone_when_wms_has_no_result(
        self,
        _property,
        _coordinates,
        _valuation,
    ):
        result = buscar_por_referencia_catastral(
            BuscarRCRequest(referencia_catastral="2749704YJ0624N0001DI")
        )
        self.assertIsNone(result["zona_valor"])
        self.assertEqual(result["valor_rep"], 0)

    @patch(
        "main.get_property",
        side_effect=CatastroUpstreamError("Catastro no disponible"),
    )
    def test_upstream_failure_is_reported_as_bad_gateway(self, _property):
        with self.assertRaises(HTTPException) as raised:
            buscar_por_referencia_catastral(
                BuscarRCRequest(referencia_catastral="2749704YJ0624N0001DI")
            )

        self.assertEqual(raised.exception.status_code, 502)

    @patch("main.get_coordinates", return_value=ET.fromstring(COORDINATE_XML))
    @patch("main.get_rustic_property", return_value=ET.fromstring(PROPERTY_XML))
    def test_rustic_lookup_uses_found_reference(self, _property, _coordinates):
        result = buscar_parcela_rustica(
            BuscarRusticaRequest(
                provincia="Jaén",
                municipio="Andújar",
                poligono="1",
                parcela="1",
            )
        )
        self.assertTrue(result["encontrado"])
        self.assertEqual(result["rc"], "2749704YJ0624N")

    @patch(
        "main.get_reference_by_coordinates",
        return_value=ET.fromstring(COORDINATE_XML),
    )
    def test_reverse_lookup_returns_base_reference(self, _lookup):
        result = buscar_por_coordenadas(
            BuscarCoordsRequest(lat=39.4080401, lon=-0.6452626)
        )
        self.assertEqual(result["rc"], "2749704YJ0624N")


if __name__ == "__main__":
    unittest.main()
