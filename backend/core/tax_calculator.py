import math
import urllib.request
import ssl
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

# =====================================================
# DATA FOR ANDUJAR (PONENCIA 2010)
# =====================================================

ANDUJAR_DATA = {
    "municipio": "Andújar",
    "provincia": "Jaén",
    "anio_ponencia": 2010,
    "mbc": 550.00,
    "mbr": 450.00,
    "rm": 0.50,
    "tipo_ibi": {
        "urbano": 0.00593,
        "rustico": 0.01068,
        "bice": 0.01286
    },
    "coef_ibi_rustica": 1.086,
    "poligonos": {
        "P01": {"denom": "CENTRO URBANO", "vrb": "R37C", "vrb_val": 423.00},
        "P02": {"denom": "CENTRO HISTÓRICO", "vrb": "R40", "vrb_val": 342.00},
        "P03": {"denom": "CASCO URBANO", "vrb": "R47", "vrb_val": 172.00},
        "P04": {"denom": "INDUSTRIAL", "vub_code": "U43", "vub": 85.00, "vrb": "R55", "vrb_val": 60.00},
        "P05": {"denom": "SUELO URBANIZABLE RESIDENCIAL", "vrb": "R43", "vrb_val": 262.00},
        "P06": {"denom": "SUELO URBANIZABLE IND Y TERCIA", "vub_code": "U43", "vub": 85.00, "vrb": "R55", "vrb_val": 60.00},
        "P07": {"denom": "POBLADOS", "vrb": "R58", "vrb_val": 37.80},
        "P08": {"denom": "SANTUARIO", "vrb": "R40", "vrb_val": 342.00},
    },
    "zonas_valor": {
        "R37": {"vivienda": 423.0, "comercial": 423.0, "oficinas": 423.0, "industri": 296.0, "garajes": 63.45},
        "R37C": {"vivienda": 423.0, "comercial": 575.0, "oficinas": 423.0, "industri": 296.0, "garajes": 63.45},
        "R40": {"vivienda": 342.0, "comercial": 342.0, "oficinas": 342.0, "industri": 239.0, "garajes": 51.30},
        "R43": {"vivienda": 262.0, "comercial": 262.0, "oficinas": 262.0, "industri": 183.0, "garajes": 39.30},
        "R47": {"vivienda": 172.0, "comercial": 172.0, "oficinas": 172.0, "industri": 120.0, "garajes": 36.00},
        "R50": {"vivienda": 118.0, "comercial": 118.0, "oficinas": 118.0, "industri": 83.0, "garajes": 36.00},
        "R55": {"vivienda": 60.0, "comercial": 60.0, "oficinas": 60.0, "industri": 42.0, "garajes": 36.00},
        "R58": {"vivienda": 37.8, "comercial": 37.8, "oficinas": 37.8, "industri": 37.8, "garajes": 36.00},
    }
}

# Add Fuencaliente as fallback / secondary
FUENCALIENTE_DATA = {
    "municipio": "Fuencaliente",
    "provincia": "Ciudad Real",
    "anio_ponencia": 1990,
    "mbc": 500.0,
    "mbr": 400.0,
    "rm": 0.50,
    "tipo_ibi": {
        "urbano": 0.00510,
        "rustico": 0.00600,
        "bice": 0.00600
    },
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

# Major Municipalities (Estimations / Placeholders based on recent Ponencias)
MADRID_DATA = {
    "municipio": "Madrid",
    "provincia": "Madrid",
    "anio_ponencia": 2011,
    "mbc": 950.0,
    "mbr": 1800.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00428, "rustico": 0.00567, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

BARCELONA_DATA = {
    "municipio": "Barcelona",
    "provincia": "Barcelona",
    "anio_ponencia": 2017,
    "mbc": 1100.0,
    "mbr": 2100.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.0066, "rustico": 0.0066, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

VALENCIA_DATA = {
    "municipio": "Valencia",
    "provincia": "Valencia",
    "anio_ponencia": 2021,
    "mbc": 750.0,
    "mbr": 1200.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00723, "rustico": 0.00723, "bice": 0.00723},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

SEVILLA_DATA = {
    "municipio": "Sevilla",
    "provincia": "Sevilla",
    "anio_ponencia": 2001,
    "mbc": 600.0,
    "mbr": 900.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00675, "rustico": 0.00675, "bice": 0.00675},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

ZARAGOZA_DATA = {
    "municipio": "Zaragoza",
    "provincia": "Zaragoza",
    "anio_ponencia": 2013,
    "mbc": 700.0,
    "mbr": 1000.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00404, "rustico": 0.00404, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

MALAGA_DATA = {
    "municipio": "Málaga",
    "provincia": "Málaga",
    "anio_ponencia": 2016,
    "mbc": 850.0,
    "mbr": 1500.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00451, "rustico": 0.00451, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

MURCIA_DATA = {
    "municipio": "Murcia",
    "provincia": "Murcia",
    "anio_ponencia": 2015,
    "mbc": 650.0,
    "mbr": 950.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00511, "rustico": 0.00511, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

PALMA_DATA = {
    "municipio": "Palma de Mallorca",
    "provincia": "Illes Balears",
    "anio_ponencia": 2012,
    "mbc": 1000.0,
    "mbr": 1900.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00490, "rustico": 0.00490, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

BILBAO_DATA = {
    "municipio": "Bilbao",
    "provincia": "Bizkaia",
    "anio_ponencia": 2016,
    "mbc": 1050.0,
    "mbr": 2000.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00194, "rustico": 0.00194, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

VALLADOLID_DATA = {
    "municipio": "Valladolid",
    "provincia": "Valladolid",
    "anio_ponencia": 2017,
    "mbc": 600.0,
    "mbr": 850.0,
    "rm": 0.50,
    "tipo_ibi": {"urbano": 0.00613, "rustico": 0.00613, "bice": 0.0080},
    "coef_ibi_rustica": 1.00,
    "poligonos": {},
    "zonas_valor": {}
}

MUNICIPALITIES = {
    "Andújar": ANDUJAR_DATA,
    "Fuencaliente": FUENCALIENTE_DATA,
    "Madrid": MADRID_DATA,
    "Barcelona": BARCELONA_DATA,
    "Valencia": VALENCIA_DATA,
    "Sevilla": SEVILLA_DATA,
    "Zaragoza": ZARAGOZA_DATA,
    "Málaga": MALAGA_DATA,
    "Murcia": MURCIA_DATA,
    "Palma de Mallorca": PALMA_DATA,
    "Palma": PALMA_DATA, # Alías común
    "Bilbao": BILBAO_DATA,
    "Valladolid": VALLADOLID_DATA
}

# =====================================================
# COEFFICIENTS RD 1020/1993
# =====================================================

def get_coef_antiguedad(anio_const, uso_const="vivienda"):
    import datetime
    edad = datetime.datetime.now().year - anio_const
    if edad < 0: return 1.00
    if edad <= 4: coef = 1.00
    elif edad <= 9: coef = 0.92
    elif edad <= 14: coef = 0.85
    elif edad <= 19: coef = 0.78
    elif edad <= 24: coef = 0.72
    elif edad <= 29: coef = 0.66
    elif edad <= 39: coef = 0.61
    elif edad <= 49: coef = 0.56
    elif edad <= 74: coef = 0.45
    else: coef = 0.30
    
    if uso_const == "industrial" and edad >= 10:
        coef = max(0.0, coef - 0.05)
    return round(coef, 2)

COEF_CONSERVACION = {
    "normal": 1.00,
    "regular": 0.85,
    "deficiente": 0.50,
    "ruinoso": 0.00
}

COEF_TIPOLOGIA = {
    # 1. Residencial (Vivienda)
    "vivienda": {1:1.10, 2:1.05, 3:1.00, 4:0.95, 5:0.90, 6:0.85, 7:0.80, 8:0.75, 9:0.70},
    # 2. Industrial / Almacén (Usando la tabla I del Anexo como referencia estandarizada)
    "industrial": {1:1.00, 2:0.95, 3:0.90, 4:0.85, 5:0.80, 6:0.75, 7:0.70, 8:0.65, 9:0.60},
    # 3. Oficinas
    "oficinas": {1:1.15, 2:1.10, 3:1.05, 4:1.00, 5:0.95, 6:0.90, 7:0.85, 8:0.80, 9:0.75},
    # 4. Comercial
    "comercial": {1:1.20, 2:1.15, 3:1.10, 4:1.05, 5:1.00, 6:0.95, 7:0.90, 8:0.85, 9:0.80},
    # 5. Deportes (cerrados)
    "deportes": {1:1.00, 2:0.95, 3:0.90, 4:0.85, 5:0.80, 6:0.75, 7:0.70, 8:0.65, 9:0.60},
    # 6. Ocio y Hostelería
    "hosteleria": {1:1.15, 2:1.10, 3:1.05, 4:1.00, 5:0.95, 6:0.90, 7:0.85, 8:0.80, 9:0.75},
    # 7. Turismo (Hoteles)
    "turismo": {1:1.25, 2:1.15, 3:1.10, 4:1.05, 5:1.00, 6:0.95, 7:0.90, 8:0.85, 9:0.80},
    # 8. Sanidad y Beneficencia
    "sanidad": {1:1.10, 2:1.05, 3:1.00, 4:0.95, 5:0.90, 6:0.85, 7:0.80, 8:0.75, 9:0.70},
    # 9. Espectáculos
    "espectaculos": {1:1.15, 2:1.10, 3:1.05, 4:1.00, 5:0.95, 6:0.90, 7:0.85, 8:0.80, 9:0.75},
    # 10. Cultural y Religioso
    "cultural": {1:1.05, 2:1.00, 3:0.95, 4:0.90, 5:0.85, 6:0.80, 7:0.75, 8:0.70, 9:0.65},
    # 11. Edificios singulares
    "singular": {1:1.25, 2:1.20, 3:1.15, 4:1.10, 5:1.05, 6:1.00, 7:0.95, 8:0.90, 9:0.85},
    # 12. Estacionamiento (Cubiertos, etc) - Agrupado bajo garajes
    "garajes": {1:0.85, 2:0.80, 3:0.75, 4:0.70, 5:0.65, 6:0.60, 7:0.55, 8:0.50, 9:0.45},
    # 13. Agrícola y Ganadero
    "agricola": {1:0.80, 2:0.75, 3:0.70, 4:0.65, 5:0.60, 6:0.55, 7:0.50, 8:0.45, 9:0.40}
}

COEF_SUELO_OCUPADO_RUSTICO = {
    "residencial": {"mbr_type": "urbano", "coef": 0.070},
    "industrial": {"mbr_type": "urbano", "coef": 0.047},
    "deportivo": {"mbr_type": "urbano", "coef": 0.023},
    "agricola": {"mbr_type": "rustico", "coef": 0.1007},
    "varios": {"mbr_type": "rustico", "coef": 0.50}
}

def get_coef_edificabilidad(edif_max, edif_real):
    if edif_max <= 0: return 1.00
    ratio = edif_real / edif_max
    if ratio < 0.50: return 0.80
    elif ratio < 0.90: return 0.90
    elif ratio <= 1.10: return 1.00
    else: return 1.10

# =====================================================
# CALCULATION CORE
# =====================================================

class TaxCalculator:
    @staticmethod
    def get_valuation_zone(lat: float, lon: float) -> Optional[str]:
        """
        Consulta el WMS de Valoración del Catastro para obtener la zona.
        """
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            # Formar URL de GetFeatureInfo
            # Usamos un BBOX pequeño alrededor del punto
            delta = 0.0001
            bbox = f"{lon-delta},{lat-delta},{lon+delta},{lat+delta}"
            url = (
                f"https://ovc.catastro.meh.es/cartografia/WMS/ServidorWMS.aspx?"
                f"SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&"
                f"LAYERS=VALORACION&QUERY_LAYERS=VALORACION&"
                f"INFO_FORMAT=text/xml&SRS=EPSG:4326&"
                f"BBOX={bbox}&WIDTH=101&HEIGHT=101&X=50&Y=50"
            )
            
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                # El Catastro suele usar latin-1 en sus WMS
                raw_data = response.read()
                try: xml_data = raw_data.decode("utf-8")
                except: xml_data = raw_data.decode("latin-1")
                
                # Intentar buscar referencias de valores (Zonas R, U...)
                import re
                
                # Zonas genéricas (R47, U43, etc.)
                zona_match = re.search(r'Zona:?\s*([A-Z][0-9]{2}[A-Z]?)', xml_data, re.IGNORECASE)
                zona_encontrada = zona_match.group(1).upper() if zona_match else None
                
                # Polígonos de valoración específicos (P04, etc.)
                poli_match = re.search(r'Pol[ií]gono:?\s*(P[0-9]{2})', xml_data, re.IGNORECASE)
                
                if poli_match:
                    poli = poli_match.group(1).upper()
                    print(f"DEBUG WMS: Polígono detectado={poli}")
                    if poli in ANDUJAR_DATA["poligonos"]:
                        return ANDUJAR_DATA["poligonos"][poli]["vrb"].replace("C", "")
                
                # Fallback: devolver la Zona VBR encontrada
                if zona_encontrada:
                    return zona_encontrada
                
            print(f"DEBUG WMS: No se encontró zona ni polígono en el XML. Texto completo: {xml_data}")
            return None
        except Exception as e:
            print(f"Error detectando zona WMS: {e}")
            return None

    @staticmethod
    def get_zone_value(municipio: str, zona: str, uso: str = "vivienda") -> float:
        # Encontrar el municipio ignorando mayúsculas y acentos
        def normalize(text):
            import unicodedata
            return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()
            
        muni_key = "Andújar" # Default
        target_norm = normalize(municipio)
        for k in MUNICIPALITIES.keys():
            if normalize(k) == target_norm:
                muni_key = k
                break

        data = MUNICIPALITIES.get(muni_key, ANDUJAR_DATA)
        
        if zona in data["zonas_valor"]:
            return data["zonas_valor"][zona].get(uso, 0.0)
            
        # Fallback for generic capital zones - simple heuristic based on MBR
        # If it's a known city but we don't have the exact Euro/m2 table, we use the average MBR as a baseline.
        if muni_key != "Andújar" and muni_key != "Fuencaliente":
            return data["mbr"]
            
        return 0.0

    @staticmethod
    def calculate(params: Dict[str, Any]) -> Dict[str, Any]:
        import copy
        municipio_name = params.get("municipio", "Andújar")
        # Load base data from known municipalities or use a default template
        # Use deepcopy to avoid polluting the global MUNICIPALITIES dict
        base_data = copy.deepcopy(MUNICIPALITIES.get(municipio_name, ANDUJAR_DATA))
        
        # Override with custom parameters if provided (for generic municipality support)
        if params.get("custom_mbc"): base_data["mbc"] = float(params["custom_mbc"])
        if params.get("custom_mbr"): base_data["mbr"] = float(params["custom_mbr"])
        if params.get("custom_rm"): base_data["rm"] = float(params["custom_rm"])
        
        # Override IBI types
        if params.get("custom_tipo_urbano"):
            base_data["tipo_ibi"]["urbano"] = float(params["custom_tipo_urbano"])
        if params.get("custom_tipo_rustico"):
            base_data["tipo_ibi"]["rustico"] = float(params["custom_tipo_rustico"])
        
        if params.get("custom_anio_ponencia"):
            base_data["anio_ponencia"] = int(params["custom_anio_ponencia"])

        data = base_data
        RM = data["rm"]
        GB = float(params.get("custom_gb", 1.0))
        clase = params.get("clase", "urbano")
        
        # 1. VALOR SUELO URBANO
        suelo_urb = 0.0
        if clase == "urbano":
            sup_parcela = float(params.get("sup_parcela", 0))
            valor_rep = float(params.get("valor_rep", 0))
            # If valor_rep is 0, try to get it from zone
            if valor_rep == 0 and "zona_valor" in params:
                zona = params["zona_valor"]
                uso = params.get("uso_const", "vivienda")
                if zona in data["zonas_valor"]:
                    valor_rep = data["zonas_valor"][zona].get(uso, 0)
            
            edif_max = float(params.get("edif_max", 0))
            edif_real = float(params.get("edif_real", 0))
            coef_edif = get_coef_edificabilidad(edif_max, edif_real)
            
            suelo_urb = round(sup_parcela * valor_rep * coef_edif * RM * GB, 2)

        # 2. VALOR SUELO RÚSTICO
        suelo_rust_no = 0.0
        suelo_rust_oc = 0.0
        if clase == "rustico":
            ha = float(params.get("ha", 0))
            tipo_eval = float(params.get("tipo_eval", 0))
            suelo_rust_no = round(ha * tipo_eval, 2)
            
            uso_suelo = params.get("uso_suelo_rust", "residencial")
            sup_oc = float(params.get("sup_ocupada", 0))
            
            suelo_rustico_config = COEF_SUELO_OCUPADO_RUSTICO.get(uso_suelo, {"mbr_type": "rustico", "coef": 0.50})
            coef_suelo = suelo_rustico_config["coef"]
            
            # TODO: Idealmente tener mbr_rustico en MUNICIPALITIES. Aquí usamos el valor de polígono poblados como aproximación o el parametrizado
            mbr_aplicar = data["mbr"] if suelo_rustico_config["mbr_type"] == "urbano" else data.get("mbr_rustico", 37.80)
            if params.get("custom_mbr_rustico"):
                mbr_aplicar = float(params["custom_mbr_rustico"])
                
            suelo_rust_oc = round(sup_oc * (mbr_aplicar * coef_suelo) * RM * GB, 2)

        # 3. VALOR CONSTRUCCIÓN
        construccion = 0.0
        sup_const = float(params.get("sup_const", 0))
        if sup_const > 0:
            uso_const = params.get("uso_const", "vivienda")
            categoria = int(params.get("categoria", 3))
            anio_const = int(params.get("anio_const", 2000))
            estado = params.get("estado", "normal")
            
            coef_tipo = COEF_TIPOLOGIA.get(uso_const, COEF_TIPOLOGIA["vivienda"]).get(categoria, 1.0)
            coef_h = get_coef_antiguedad(anio_const, uso_const)
            coef_i = COEF_CONSERVACION.get(estado, 1.00)
            
            construccion_base = round(sup_const * data["mbc"] * coef_tipo * coef_h * coef_i * RM * GB, 2)
            
            # Support array of constructions
            construccion = construccion_base
            if "construcciones" in params and isinstance(params["construcciones"], list):
                construccion = 0.0
                for c in params["construcciones"]:
                    c_uso = c.get("uso", "vivienda")
                    c_cat = int(c.get("categoria", 3))
                    c_anio = int(c.get("anio_const", 2000))
                    c_estado = c.get("estado", "normal")
                    c_sup = float(c.get("sup_const", 0))
                    
                    c_coef_tipo = COEF_TIPOLOGIA.get(c_uso, COEF_TIPOLOGIA["vivienda"]).get(c_cat, 1.0)
                    c_coef_h = get_coef_antiguedad(c_anio, c_uso)
                    c_coef_i = COEF_CONSERVACION.get(c_estado, 1.00)
                    
                    c_valor = round(c_sup * data["mbc"] * c_coef_tipo * c_coef_h * c_coef_i * RM * GB, 2)
                    construccion += c_valor

        # TOTAL CATASTRAL
        total = round(suelo_urb + suelo_rust_no + suelo_rust_oc + construccion, 2)

        # IBI
        if clase == "rustico":
            base_ibi = round(total * data["coef_ibi_rustica"], 2)
        else:
            base_ibi = total
            
        tipo_ibi = data["tipo_ibi"].get(clase, 0.005)
        cuota = round(base_ibi * tipo_ibi, 2)

        return {
            "municipio": municipio_name,
            "provincia": data["provincia"],
            "suelo_urbano": suelo_urb,
            "suelo_rustico_no_ocupado": suelo_rust_no,
            "suelo_rustico_ocupado": suelo_rust_oc,
            "construccion": construccion,
            "valor_catastral_total": total,
            "base_ibi": base_ibi,
            "tipo_aplicado": tipo_ibi,
            "cuota_ibi_anual": cuota
        }
