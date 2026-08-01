import unittest

from pydantic import ValidationError

from core.tax_calculator import TaxCalculator, get_coef_antiguedad
from main import CalcularTaxRequest


class TaxRequestValidationTests(unittest.TestCase):
    def test_rejects_negative_areas(self):
        with self.assertRaises(ValidationError):
            CalcularTaxRequest(sup_parcela=-1)

    def test_rejects_invalid_category_and_class(self):
        with self.assertRaises(ValidationError):
            CalcularTaxRequest(categoria=10)
        with self.assertRaises(ValidationError):
            CalcularTaxRequest(clase="desconocido")

    def test_accepts_zero_ibi_rate_for_exempt_scenarios(self):
        request = CalcularTaxRequest(custom_tipo_urbano=0)
        self.assertEqual(request.custom_tipo_urbano, 0)


class AgeCoefficientTests(unittest.TestCase):
    def test_uses_reference_year_usage_and_category(self):
        self.assertEqual(get_coef_antiguedad(2010, 1976, "vivienda", 5), 0.59)
        self.assertEqual(get_coef_antiguedad(2010, 1980, "industrial", 5), 0.56)

    def test_future_construction_is_not_depreciated(self):
        self.assertEqual(get_coef_antiguedad(2010, 2012, "vivienda", 5), 1.0)


class MunicipalityProfileTests(unittest.TestCase):
    def test_unknown_municipality_does_not_inherit_andujar(self):
        with self.assertRaisesRegex(ValueError, "no tiene un perfil documentado"):
            TaxCalculator.calculate({"municipio": "Madrid", "clase": "urbano"})

    def test_custom_profile_preserves_zero_ibi_rate(self):
        result = TaxCalculator.calculate({
            "municipio": "Municipio personalizado",
            "clase": "urbano",
            "sup_parcela": 100,
            "valor_rep": 200,
            "edif_max": 0,
            "edif_real": 0,
            "sup_const": 0,
            "custom_mbc": 600,
            "custom_mbr": 300,
            "custom_mbr_rustico": 40,
            "custom_rm": .5,
            "custom_gb": 1.2,
            "custom_tipo_urbano": 0,
            "custom_tipo_rustico": .01,
            "custom_anio_ponencia": 2020,
        })
        self.assertEqual(result["suelo_urbano"], 12_000)
        self.assertEqual(result["tipo_aplicado"], 0)
        self.assertEqual(result["cuota_ibi_anual"], 0)

    def test_unknown_zone_never_uses_andujar_values(self):
        self.assertEqual(TaxCalculator.get_zone_value("Madrid", "R37"), 0)


class ValuationWmsTests(unittest.TestCase):
    def test_extracts_zone_from_official_ponencias_response(self):
        payload = """
        <html><body><p>Zona de valor:</p><table>
        <tr><td>Municipio</td><td>Código de zona</td></tr>
        <tr><td>ANDUJAR</td><td>R47</td></tr>
        </table></body></html>
        """.encode("latin-1")
        self.assertEqual(
            TaxCalculator.parse_valuation_zone_response(payload),
            "R47",
        )

    def test_returns_none_when_response_has_no_zone(self):
        self.assertIsNone(
            TaxCalculator.parse_valuation_zone_response(b"<html>Sin datos</html>")
        )


if __name__ == "__main__":
    unittest.main()
