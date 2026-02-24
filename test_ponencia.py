import json
from backend.core.tax_calculator import TaxCalculator

params_madrid = {
    "municipio": "Madrid",
    "clase": "urbano",
    "uso_const": "vivienda",
    "anio_const": 2002,
    "sup_const": 100,
    "custom_anio_ponencia": 2012
}

result = TaxCalculator.calculate(params_madrid)
print("=== CON PONENCIA (2012) ===")
print("Construcción:", result["construccion"])

# Sin ponencia dinamica -> El fallback usará 2011 (dato real Madrid) o similar si está parametrizado.
# Vamos a forzar un municipio sin ponencia.
params_sin_ponencia = {
    "municipio": "Pueblo Inventado",
    "clase": "urbano",
    "uso_const": "vivienda",
    "anio_const": 2002,
    "sup_const": 100,
    "custom_mbc": 950.0 # mismo mbc para comparar manzanas
}
result2 = TaxCalculator.calculate(params_sin_ponencia)
print("=== SIN PONENCIA ===")
print("Construcción:", result2["construccion"])
