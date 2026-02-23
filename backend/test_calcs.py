import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.tax_calculator import TaxCalculator

def test_rustica_3():
    # HOJA DE VALORACIÓN RÚSTICA 3
    # Suelo Rústico Valor Agronómico
    # a 0,8525 Ha. OR Olivos regadío. Importe: 25,242508 €/Ha, Total: 376,55. Actually 0.8525 * 25.242508 / 0.057? No, the PDF says 376.55. Wait, 0.8525 * 25.24 = 21.5... If the formula is (ha * Renta)/0.057, maybe it is just "ha * tipo_evaluator". In PDF, 376.55/0.8525 = 441.70 €/ha.
    # Ah, the PDF says "IMPORTE (€/Ha.) : 25,242508" But "VALOR (€): 376.55". Wait, 25.242508 * 0.8525 = 21.51. The value is 376.55? Wait, maybe 25.242508 is not the type, it's the rent. And capitalized at 0.0571 = 442.07 * 0.8525 = 376.8?
    # Let's extract exactly what's needed.
    # Let's write the inputs and expected outputs.
    
    params = {
        "municipio": "Andújar",
        "clase": "rustico",
        "ha": 0.8525,
        "tipo_eval": 441.70, # 376.55 / 0.8525
        "uso_suelo_rust": "residencial",
        "sup_ocupada": 350,
        "sup_const": 249 + 82 + 19, # 350
        "uso_const": "vivienda",
        "categoria": 5, #? 
        "anio_const": 2001,
        "estado": "normal",
        "custom_mbc": 550.00,
        "custom_mbr": 450.00,
        "custom_rm": 0.50,
        "custom_anio_ponencia": 2010
    }
    res = TaxCalculator.calculate(params)
    print("RUSTICA 3 RESULT:", res)
    
if __name__ == '__main__':
    test_rustica_3()
