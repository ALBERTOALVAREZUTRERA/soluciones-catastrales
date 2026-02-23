"""
Backend FastAPI para Visor/Conversor Catastral DXF ↔ GML
MEJORAS: Topología + Detección de Conflictos + Conversión coordenadas
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import tempfile
import os
import re
import urllib.request
import ssl
import json
import xml.etree.ElementTree as ET
from pathlib import Path

# Importar módulos core
from core.dxf_reader import DXFReader
from core.gml_generator import GMLGenerator
from core.parcel_model import ParcelaInfo
from core.conflict_detector import ConflictDetector
from core.coordinate_transformer import CoordinateTransformer
from core.kml_generator import generate_kml_from_gml_features
from core.tax_calculator import TaxCalculator, MUNICIPALITIES
from core.building_generator import BuildingGenerator
from core.dxf_generator import DXFGenerator
from core.shape_generator import ShapeGenerator

# Crear app FastAPI
app = FastAPI(
    title="API Conversor Catastral DXF ↔ GML",
    description="API REST para procesamiento de archivos catastrales con mejoras topológicas",
    version="1.0.0"
)

# Configurar CORS para producción y desarrollo
admitted_origins_str = os.getenv(
    "ADMITTED_ORIGINS", 
    "http://localhost:9002,http://localhost:3000,https://www.solucionescatastrales.app,https://solucionescatastrales.app,https://soluciones-catastrales-git-main-albertos-projects-5a599afd.vercel.app,https://soluciones-catastrales-1cjfcpwy2-albertos-projects-5a599afd.vercel.app"
)
allow_origins = [orig.strip() for orig in admitted_origins_str.split(",") if orig.strip() and orig.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== MODELOS PYDANTIC =====

class ParcelaResponse(BaseModel):
    """Modelo de respuesta para una parcela procesada"""
    id: str
    referencia_catastral: Optional[str]
    area: float
    coordenadas_utm: List[List[float]]  # [[x, y], ...]
    coordenadas_latlon: List[List[float]]  # Para visualización en mapa
    interiores_utm: List[List[List[float]]]  # Huecos/agujeros
    interiores_latlon: List[List[List[float]]]
    has_conflict: bool = False
    is_hole: bool = False
    capa_origen: str = ""
    nombre_archivo: str = ""


class AnalyzeResponse(BaseModel):
    """Respuesta del endpoint /analyze"""
    parcelas: List[ParcelaResponse]
    num_parcelas: int
    num_conflictos: int
    num_huecos: int
    epsg_utm: str
    mensaje: str


class GenerateGMLRequest(BaseModel):
    """Request para generar GML con referencias editadas"""
    parcelas: List[Dict[str, Any]]
    epsg: str = "25830"


# ===== ENDPOINTS =====

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "API Conversor Catastral DXF ↔ GML",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /analyze - Analizar archivo DXF",
            "generate-gml": "POST /generate-gml - Generar GML con datos editados",
            "health": "GET /health - Health check"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "catastro-api"}

from core.shp_reader import SHPReader

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_file(
    file: UploadFile = File(...),
    epsg: str = Query("25830", description="Código EPSG del sistema UTM (25829, 25830, 25831, 32628)"),
    tipo_entidad: str = Query("CP", description="Tipo de entidad: CP (Parcela) o BU (Edificio)")
):
    """
    Analiza un archivo DXF o ZIP (Shapefile) y devuelve parcelas/edificios.
    """
    
    filename = file.filename.lower()
    if not (filename.endswith('.dxf') or filename.endswith('.zip')):
        raise HTTPException(status_code=400, detail="El archivo debe ser DXF o ZIP (Shapefile)")
    
    try:
        # Guardar archivo temporalmente
        suffix = '.zip' if filename.endswith('.zip') else '.dxf'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        print(f"DEBUG: Archivo guardado en: {tmp_path}")
        
        parcelas = []
        if filename.endswith('.zip'):
            # 1. Leer de Shapefile (ZIP)
            parcelas = SHPReader.leer_desde_zip(tmp_path)
            print(f"DEBUG: {len(parcelas)} geometrías extraídas de SHP")
        else:
            # 2. Leer de DXF
            # Obtener capas del DXF
            capas_info = DXFReader.obtener_capas_con_detalle(tmp_path)
            print(f"DEBUG: Capas encontradas: {capas_info}")
            
            # Selección de capas según tipo
            if tipo_entidad == "BU":
                # Para edificios, ser más permisivo (usar todas las capas con geometrías si no hay LP/LI específicas)
                capas_parcelas = [c[0] for c in capas_info if c[1] > 0]
                capa_textos = [c[0] for c in capas_info if c[2] > 0]
                capa_textos = capa_textos[0] if capa_textos else ""
            else:
                # Lógica original para parcelas
                capas_parcelas = [c[0] for c in capas_info if 'LP' in c[0].upper() and c[1] > 0]
                capas_textos = [c[0] for c in capas_info if 'LT' in c[0].upper() and c[2] > 0]
                
                if not capas_parcelas:
                    capas_parcelas = [c[0] for c in capas_info if c[1] > 0]
                
                capa_textos = capas_textos[0] if capas_textos else ""
            
            print(f"DEBUG: Capas seleccionadas - Geometría: {capas_parcelas}, Textos: {capa_textos}")
            
            # Leer parcelas/edificios del DXF
            parcelas = DXFReader.leer_borde_parcelas(tmp_path, capas_parcelas, capa_textos)
            print(f"DEBUG: {len(parcelas)} geometrías extraídas de DXF")
        
        # Asignar tipo de entidad y asegurar nombre de archivo original
        base_filename = os.path.splitext(file.filename)[0]
        for p in parcelas:
            p.tipo_entidad = tipo_entidad
            # Si el nombre detectado es genérico o nulo, usar el del archivo original
            if not p.nombre_archivo or "TMP" in p.nombre_archivo.upper() or "PARCELA_" in p.nombre_archivo.upper():
                p.nombre_archivo = base_filename
            
            # Asegurar que nombre_original tenga el nombre real del archivo (sin prefijos temporales)
            p.nombre_original = base_filename
        
        # 3. MEJORA 1: Limpieza topológica
        parcelas = DXFReader.limpiar_topologia(parcelas)
        print(f"DEBUG: Limpieza topológica completada")
        
        # 4. Detectar nesting (huecos interiores)
        anidamientos = DXFReader.detect_nesting(parcelas)
        print(f"DEBUG: Anidamientos detectados: {anidamientos}")
        
        # Marcar huecos con is_hole=True
        parcelas = ConflictDetector.marcar_huecos(parcelas, anidamientos)
        
        # Agrupar parcelas por padre (agregar huecos a su padre)
        parcelas_procesadas = []
        indices_procesados = set()
        
        for idx, parcela in enumerate(parcelas):
            if idx in indices_procesados:
                continue
            
            # Si es un padre con huecos, agregar interiores
            if idx in anidamientos:
                for hijo_idx in anidamientos[idx]:
                    if hijo_idx < len(parcelas):
                        parcela.interiores.append(parcelas[hijo_idx].coordenadas)
                        indices_procesados.add(hijo_idx)
            
            # Si no es un hueco independiente, añadir
            if not parcela.is_hole or idx not in indices_procesados:
                parcelas_procesadas.append(parcela)
                indices_procesados.add(idx)
        
        parcelas = parcelas_procesadas
        print(f"DEBUG: {len(parcelas)} parcelas después de agrupar huecos")
        
        # 5. MEJORA 2: Detección de conflictos
        parcelas = ConflictDetector.detectar_conflictos(parcelas)
        
        # 6. Convertir coordenadas UTM → Lat/Lon
        for parcela in parcelas:
            parcela.coords_latlon = CoordinateTransformer.utm_to_latlon(parcela.coordenadas, epsg)
        
        # 7. Preparar respuesta
        parcelas_response = []
        num_conflictos = 0
        num_huecos = sum(len(p.interiores) for p in parcelas)
        
        for parcela in parcelas:
            # Convertir interiores a Lat/Lon
            interiores_latlon = [
                CoordinateTransformer.utm_to_latlon(hueco, epsg)
                for hueco in parcela.interiores
            ]
            
            parcelas_response.append(ParcelaResponse(
                id=parcela.identificador,
                referencia_catastral=parcela.referencia_catastral,
                area=parcela.area,
                coordenadas_utm=[[x, y] for x, y in parcela.coordenadas],
                coordenadas_latlon=[[lon, lat] for lon, lat in parcela.coords_latlon],
                interiores_utm=[[[x, y] for x, y in hueco] for hueco in parcela.interiores],
                interiores_latlon=[[[lon, lat] for lon, lat in hueco_ll] for hueco_ll in interiores_latlon],
                has_conflict=parcela.has_conflict,
                is_hole=parcela.is_hole,
                capa_origen=parcela.capa_origen,
                nombre_archivo=parcela.nombre_original or parcela.nombre_archivo
            ))
            
            if parcela.has_conflict:
                num_conflictos += 1
        
        # Limpiar archivo temporal
        os.unlink(tmp_path)
        
        return AnalyzeResponse(
            parcelas=parcelas_response,
            num_parcelas=len(parcelas),
            num_conflictos=num_conflictos,
            num_huecos=num_huecos,
            epsg_utm=epsg,
            mensaje="Análisis completado exitosamente"
        )
    
    except Exception as e:
        # Limpiar archivo temporal en caso de error
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error procesando DXF: {str(e)}")


@app.post("/generate-gml")
async def generate_gml(request: GenerateGMLRequest):
    """
    Genera un archivo GML a partir de datos de parcelas (posiblemente editados por el usuario)
    """
    try:
        # Sanitizar EPSG
        request.epsg = str(request.epsg).upper().replace("EPSG:", "")
        
        # Crear directorio temporal para GML
        temp_dir = tempfile.mkdtemp()
        
        # Convertir datos JSON a ParcelaInfo
        parcelas = []
        for p_data in request.parcelas:
            parcela = ParcelaInfo()
            parcela.referencia_catastral = p_data.get('referencia_catastral', '')
            parcela.nombre_archivo = p_data.get('id', 'parcela')
            parcela.area = p_data.get('area', 0.0)
            
            # Convertir coordenadas lat/lon de vuelta a UTM para GML
            coords_latlon = p_data.get('coordenadas_latlon', [])
            parcela.coordenadas = CoordinateTransformer.latlon_to_utm(
                [(c[0], c[1]) for c in coords_latlon],
                request.epsg
            )
            
            # Interiores
            for hueco_ll in p_data.get('interiores_latlon', []):
                hueco_utm = CoordinateTransformer.latlon_to_utm(
                    [(c[0], c[1]) for c in hueco_ll],
                    request.epsg
                )
                parcela.interiores.append(hueco_utm)
            
            parcelas.append(parcela)
        
        # Generar GML para cada parcela
        gml_paths = []
        for parcela in parcelas:
            gml_path = GMLGenerator.generar_gml(parcela, temp_dir, usar_epsg_urn=True, epsg_code=request.epsg)
            gml_paths.append(gml_path)
        
        # Si es una sola parcela, devolver ese GML
        # Si son múltiples, podríamos combinarlas o devolver un ZIP
        if len(gml_paths) == 1:
            def file_iterator():
                with open(gml_paths[0], 'rb') as f:
                    yield from f
            
            filename = os.path.basename(gml_paths[0])
            
            return StreamingResponse(
                file_iterator(),
                media_type='application/gml+xml',
                headers={'Content-Disposition': f'attachment; filename="{filename}"'}
            )
        else:
            # TODO: Combinar múltiples GML o crear ZIP
            raise HTTPException(status_code=501, detail="Múltiples parcelas no soportado aún")
    
    except Exception as e:
        print(f"ERROR generando GML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando GML: {str(e)}")


@app.post("/generate-kml")
async def generate_kml(request: GenerateGMLRequest):
    """
    Genera un archivo KML para visualización en Google Earth.
    Las parcelas incluyen estilos diferenciados y soporte para huecos.
    """
    try:
        # Sanitizar EPSG
        request.epsg = str(request.epsg).upper().replace("EPSG:", "")
        
        # Preparar features en formato compatible
        features = []
        
        for p_data in request.parcelas:
            # Convertir coordenadas lat/lon de vuelta a UTM para el transformador
            coords_latlon = p_data.get('coordenadas_latlon', [])
            coords_utm = [[c[0], c[1]] for c in p_data.get('coordenadas_utm', [])]
            
            # Preparar geometría (exterior + huecos)
            geometry = [coords_utm]
            
            # Añadir huecos interiores
            for hueco_utm in p_data.get('interiores_utm', []):
                geometry.append([[c[0], c[1]] for c in hueco_utm])
            
            feature = {
                'id': p_data.get('id', 'Sin ID'),
                'geometry': geometry,
                'area': p_data.get('area', 0.0),
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'hasConflict': p_data.get('has_conflict', False),
                'isHole': p_data.get('is_hole', False),
                'geometryFixed': p_data.get('geometry_fixed', False)
            }
            
            features.append(feature)
        
        # Crear directorio temporal
        temp_dir = tempfile.mkdtemp()
        kml_path = os.path.join(temp_dir, "parcelas.kml")
        
        # Generar KML
        kml_file = generate_kml_from_gml_features(features, kml_path)
        
        # Devolver archivo como descarga
        def file_iterator():
            with open(kml_file, 'rb') as f:
                yield from f
        
        return StreamingResponse(
            file_iterator(),
            media_type='application/vnd.google-earth.kml+xml',
            headers={'Content-Disposition': 'attachment; filename="parcelas_catastro.kml"'}
        )
    
    except Exception as e:
        print(f"ERROR generando KML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando KML: {str(e)}")


@app.post("/generate-dxf")
async def generate_dxf(request: GenerateGMLRequest):
    """
    Exporta las parcelas actuales a formato DXF.
    """
    try:
        # Sanitizar EPSG
        request.epsg = str(request.epsg).upper().replace("EPSG:", "")
        
        temp_dir = tempfile.mkdtemp()
        dxf_path = os.path.join(temp_dir, "exportacion_catastral.dxf")
        
        # Preparar features
        features = []
        for p_data in request.parcelas:
            coords_utm = [[c[0], c[1]] for c in p_data.get('coordenadas_utm', [])]
            geometry = [coords_utm]
            for hueco_utm in p_data.get('interiores_utm', []):
                geometry.append([[c[0], c[1]] for c in hueco_utm])
                
            features.append({
                'id': p_data.get('id', 'S/N'),
                'geometry': geometry,
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'area': p_data.get('area', 0.0)
            })
            
        final_path = DXFGenerator.exportar_a_dxf(features, dxf_path, request.epsg)
        
        def file_iterator():
            with open(final_path, 'rb') as f:
                yield from f
                
        return StreamingResponse(
            file_iterator(),
            media_type='application/dxf',
            headers={'Content-Disposition': 'attachment; filename="parcelas_catastro.dxf"'}
        )
    except Exception as e:
        print(f"ERROR generando DXF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando DXF: {str(e)}")


@app.post("/generate-shape")
async def generate_shape(request: GenerateGMLRequest):
    """
    Exporta las parcelas actuales a formato Shapefile (ZIP).
    """
    try:
        # Sanitizar EPSG
        request.epsg = str(request.epsg).upper().replace("EPSG:", "")
        
        import shutil
        temp_dir = tempfile.mkdtemp()
        base_name = "exportacion_catastral"
        shp_base_path = os.path.join(temp_dir, base_name)
        
        # Preparar features
        features = []
        for p_data in request.parcelas:
            coords_utm = [[c[0], c[1]] for c in p_data.get('coordenadas_utm', [])]
            geometry = [coords_utm]
            for hueco_utm in p_data.get('interiores_utm', []):
                geometry.append([[c[0], c[1]] for c in hueco_utm])
                
            features.append({
                'id': p_data.get('id', 'S/N'),
                'geometry': geometry,
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'area': p_data.get('area', 0.0)
            })
            
        ShapeGenerator.exportar_a_shape(features, shp_base_path, request.epsg)
        
        # Crear ZIP con todos los archivos del shapefile
        zip_path = os.path.join(temp_dir, f"{base_name}.zip")
        shutil.make_archive(os.path.join(temp_dir, base_name), 'zip', temp_dir, base_name)
        
        # make_archive añade el .zip solo, así que la ruta final es zip_path
        # Pero a veces el base_dir y root_dir de make_archive son confusos.
        # Mejor hacerlo simple:
        files_to_zip = [f for f in os.listdir(temp_dir) if f.startswith(base_name) and f != f"{base_name}.zip"]
        
        import zipfile
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for f in files_to_zip:
                zipf.write(os.path.join(temp_dir, f), f)
        
        def file_iterator():
            with open(zip_path, 'rb') as f:
                yield from f
                
        return StreamingResponse(
            file_iterator(),
            media_type='application/zip',
            headers={'Content-Disposition': 'attachment; filename="parcelas_catastro.zip"'}
        )
    except Exception as e:
        print(f"ERROR generando Shapefile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando Shapefile: {str(e)}")


@app.post("/generate-building-gml")
async def generate_building_gml(request: GenerateGMLRequest):
    """
    Genera GML de Edificio (INSPIRE Building) para las parcelas enviadas.
    """
    try:
        # Sanitizar EPSG
        request.epsg = str(request.epsg).upper().replace("EPSG:", "")
        
        temp_dir = tempfile.mkdtemp()
        
        # Solo soportamos una parcela por GML de edificio por ahora
        if not request.parcelas:
             raise HTTPException(status_code=400, detail="No se enviaron parcelas")
             
        p_data = request.parcelas[0]
        parcela = ParcelaInfo()
        parcela.nombre_archivo = p_data.get('id', 'edificio')
        # Preservamos el nombre original para el nombre del archivo GML
        parcela.nombre_original = p_data.get('nombre_archivo', '')
        parcela.referencia_catastral = p_data.get('referencia_catastral', '')
        parcela.area = p_data.get('area', 0.0)
        
        # Coordenadas
        parcela.coordenadas = [[c[0], c[1]] for c in p_data.get('coordenadas_utm', [])]
        for hueco_utm in p_data.get('interiores_utm', []):
            parcela.interiores.append([[c[0], c[1]] for c in hueco_utm])
            
        gml_file = BuildingGenerator.generar_gml_edificio(parcela, temp_dir, request.epsg)
        
        def file_iterator():
            with open(gml_file, 'rb') as f:
                yield from f
                
        return StreamingResponse(
            file_iterator(),
            media_type='application/gml+xml',
            headers={'Content-Disposition': f'attachment; filename="{os.path.basename(gml_file)}"'}
        )
    except Exception as e:
        print(f"ERROR generando Building GML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando Building GML: {str(e)}")


# ══════════════════════════════════════════════════════════════════════
# PROXY CATASTRO: Búsqueda de parcelas por referencia catastral
# ══════════════════════════════════════════════════════════════════════

import urllib.request
import urllib.parse
import urllib.error
import ssl
import xml.etree.ElementTree as ET

class BuscarRCRequest(BaseModel):
    referencia_catastral: str
    provincia: Optional[str] = ""
    municipio: Optional[str] = ""

class BuscarRusticaRequest(BaseModel):
    provincia: str
    municipio: str
    poligono: str
    parcela: str

def _check_catastro_error(xml_text: str) -> Optional[str]:
    """
    Parsea el XML del Catastro y devuelve el mensaje de error si lo hay.
    Los errores vienen en la estructura <lerr><err><cod>N</cod><des>MENSAJE</des></err></lerr>
    Retorna None si no hay error.
    """
    import re
    # Buscar errores con regex (más robusto que ElementTree con namespaces)
    cod_match = re.search(r'<cod>(\d+)</cod>', xml_text, re.IGNORECASE)
    des_match = re.search(r'<des>([^<]+)</des>', xml_text, re.IGNORECASE)
    
    if cod_match and des_match:
        cod = int(cod_match.group(1))
        des = des_match.group(1).strip()
        if cod > 0:  # Código 0 = sin error
            return des
    
    # También comprobar el campo <cuerr> que indica si hay error (1 = hay error)
    cuerr_match = re.search(r'<cuerr>(\d+)</cuerr>', xml_text, re.IGNORECASE)
    if cuerr_match and int(cuerr_match.group(1)) > 0 and des_match:
        return des_match.group(1).strip()
    
    return None


@app.post("/catastro/buscar-rc")
async def buscar_por_referencia_catastral(request: BuscarRCRequest):
    """
    Proxy para consultar la API XML del Catastro.
    Busca coordenadas de una parcela por su referencia catastral.
    Evita problemas de CORS al realizar la petición desde el servidor.
    
    IMPORTANTE: La API del Catastro (Consulta_CPMRC) solo acepta
    referencias de exactamente 14 caracteres. Si el usuario introduce
    una referencia de 20 caracteres, se trunca automáticamente.
    """
    rc_original = request.referencia_catastral.strip().upper()
    if len(rc_original) < 14:
        raise HTTPException(status_code=400, detail="La referencia catastral debe tener al menos 14 caracteres")

    # Truncar a 14 caracteres: la API de coordenadas SOLO acepta 14
    rc = rc_original[:14]
    print(f"DEBUG buscar-rc: original='{rc_original}' -> truncado='{rc}'")

    try:
        # Crear contexto SSL permisivo (el certificado del Catastro a veces da problemas)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 1. Buscar datos del inmueble (para obtener dirección/info)
        url_datos = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC={rc}"
        req1 = urllib.request.Request(url_datos, headers={"User-Agent": "Mozilla/5.0"})
        resp1 = urllib.request.urlopen(req1, context=ctx, timeout=15)
        xml_datos = resp1.read().decode("utf-8")
        
        # SI LA RESPUESTA ES UNA LISTA (muchos rc), pillar el primero y re-consultar
        if "<lrcdnp>" in xml_datos and "<rcdnp>" in xml_datos:
            # Extraer pc1, pc2, car, cc1, cc2 del primer rcdnp
            def get_sub(tag, text):
                m = re.search(rf'<{tag}[^>]*>(.*?)</', text, re.I)
                return m.group(1).strip() if m else ""
            
            first_block = re.search(r'<rcdnp>(.*?)</rcdnp>', xml_datos, re.I | re.S).group(1)
            rc_full = get_sub('pc1', first_block) + get_sub('pc2', first_block) + get_sub('car', first_block) + get_sub('cc1', first_block) + get_sub('cc2', first_block)
            
            if len(rc_full) >= 14:
                url_datos_full = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC={rc_full}"
                req1_full = urllib.request.Request(url_datos_full, headers={"User-Agent": "Mozilla/5.0"})
                resp1_full = urllib.request.urlopen(req1_full, context=ctx, timeout=15)
                xml_datos_detailed = resp1_full.read().decode("utf-8")
                # Fusionar lógicamente: usamos el detailed para casi todo, pero guardamos el original para spt si falta
                xml_datos = xml_datos_detailed + xml_datos

        # Comprobar errores en respuesta de datos
        error_datos = _check_catastro_error(xml_datos)
        if error_datos:
            print(f"DEBUG buscar-rc: Error del Catastro (datos): {error_datos}")
            return {"encontrado": False, "error": f"Catastro: {error_datos}"}

        # 2. Buscar coordenadas (siempre con 14 caracteres)
        url_coord = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG:4326&RC={rc}"
        req2 = urllib.request.Request(url_coord, headers={"User-Agent": "Mozilla/5.0"})
        resp2 = urllib.request.urlopen(req2, context=ctx, timeout=15)
        xml_coord = resp2.read().decode("utf-8")
        
        # Comprobar errores en respuesta de coordenadas
        error_coord = _check_catastro_error(xml_coord)
        if error_coord:
            print(f"DEBUG buscar-rc: Error del Catastro (coords): {error_coord}")
            return {"encontrado": False, "error": f"Catastro: {error_coord}"}

        # Parsear coordenadas con regex (más robusto que ElementTree)
        xcen_match = re.search(r'<[^>]*xcen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)
        ycen_match = re.search(r'<[^>]*ycen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)

        if not xcen_match or not ycen_match:
            return {
                "encontrado": False,
                "error": "No se encontraron coordenadas para esta referencia catastral"
            }
        
        lon = float(xcen_match.group(1))
        lat = float(ycen_match.group(1))

        # 3. Extraer info del inmueble del XML de datos
        # Búsqueda directa vía regex para ser inmunes a namespaces y nesting variable
        def extract_tag(tag_name, xml_text):
            # Busca <cat:tag>contenido</cat:tag> o <tag>contenido</tag>
            # El cierre tmb puede llevar prefix: </cat:tag>
            pattern = rf'<{tag_name}[^>]*>(.*?)</[^>]*?{tag_name}>'
            match = re.search(pattern, xml_text, re.IGNORECASE | re.DOTALL)
            return match.group(1).strip() if match else ""

        direccion = extract_tag('ldt', xml_datos)
        municipio_result = extract_tag('nm', xml_datos)
        provincia_result = extract_tag('np', xml_datos)
        uso = extract_tag('tuso', xml_datos)
        
        # Superficies (pueden venir en varios sitios, pillamos cualquiera > 0)
        def get_float(tag):
            try: return float(extract_tag(tag, xml_datos).replace(',', '.'))
            except: return 0.0

        superficie_parcela = max(get_float('spt'), get_float('supf'))
        superficie_construida = max(get_float('sfc'), get_float('sup'), get_float('sct'))
        
        # Año de construcción (etiqueta 'aco' o 'ant')
        anio_str = extract_tag('aco', xml_datos) or extract_tag('ant', xml_datos)
        try: anio_const = int(anio_str)
        except: anio_const = 0
        
        # Consolidar superficies (usando las variables locales recién extraídas)
        # superficie_parcela y superficie_construida ya están calculadas arriba
        
        # 4. Detectar zona de valoración vía WMS
        zona_detectada = TaxCalculator.get_valuation_zone(lat, lon)
        print(f"DEBUG buscar-rc: RC={rc}, Lat={lat}, Lon={lon}, Zona detectada={zona_detectada}")
        
        valor_rep = 0.0
        if zona_detectada and municipio_result.upper() == "ANDUJAR":
            # Intentar mapear uso a los de la ponencia
            uso_map = "vivienda"
            if "industrial" in uso.lower() or "almacén" in uso.lower(): uso_map = "industri"
            elif "oficina" in uso.lower(): uso_map = "oficinas"
            elif "comercio" in uso.lower(): uso_map = "comercial"
            
            valor_rep = TaxCalculator.get_zone_value("Andújar", zona_detectada, uso_map)

        return {
            "encontrado": True,
            "rc": rc,
            "lat": lat,
            "lon": lon,
            "direccion": direccion,
            "municipio": municipio_result,
            "provincia": provincia_result,
            "uso": uso,
            "superficie_parcela": superficie_parcela,
            "superficie_construida": superficie_construida,
            "anio_const": anio_const,
            "zona_valor": zona_detectada,
            "valor_rep": valor_rep
        }

    except urllib.error.HTTPError as e:
        return {"encontrado": False, "error": f"Error HTTP {e.code} del servicio del Catastro"}
    except Exception as e:
        print(f"Error proxy catastro: {e}")
        return {"encontrado": False, "error": f"Error consultando el Catastro: {str(e)}"}


@app.post("/catastro/buscar-rustica")
async def buscar_parcela_rustica(request: BuscarRusticaRequest):
    """
    Proxy para buscar parcela rústica por provincia/municipio/polígono/parcela.
    """
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 1. Buscar RC por datos rústicos
        url = (
            f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPPP?"
            f"Provincia={urllib.parse.quote(request.provincia)}"
            f"&Municipio={urllib.parse.quote(request.municipio)}"
            f"&Poligono={urllib.parse.quote(request.poligono)}"
            f"&Parcela={urllib.parse.quote(request.parcela)}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        xml_text = resp.read().decode("utf-8")

        # Parsear RC del resultado
        import re
        pc1_match = re.search(r'<[^>]*pc1[^>]*>([^<]+)</[^>]*>', xml_text, re.IGNORECASE)
        pc2_match = re.search(r'<[^>]*pc2[^>]*>([^<]+)</[^>]*>', xml_text, re.IGNORECASE)

        if pc1_match and pc2_match:
            rc = pc1_match.group(1) + pc2_match.group(1)
            
            # 2. Buscar coordenadas con la RC encontrada
            url_coord = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG:4326&RC={rc}"
            req2 = urllib.request.Request(url_coord, headers={"User-Agent": "Mozilla/5.0"})
            resp2 = urllib.request.urlopen(req2, context=ctx, timeout=15)
            xml_coord = resp2.read().decode("utf-8")

            xcen_match = re.search(r'<[^>]*xcen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)
            ycen_match = re.search(r'<[^>]*ycen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)

            if xcen_match and ycen_match:
                return {
                    "encontrado": True,
                    "rc": rc,
                    "lat": float(ycen_match.group(1)),
                    "lon": float(xcen_match.group(1)),
                    "municipio": request.municipio,
                    "provincia": request.provincia,
                    "poligono": request.poligono,
                    "parcela": request.parcela,
                }
            else:
                return {"encontrado": False, "error": "Parcela encontrada pero sin coordenadas"}
        else:
            return {"encontrado": False, "error": "Parcela rústica no encontrada"}

    except Exception as e:
        print(f"Error proxy catastro rústica: {e}")
        return {"encontrado": False, "error": f"Error: {str(e)}"}


# ══════════════════════════════════════════════════════════════════════
# CALCULADORA CATASTRAL E IBI
# ══════════════════════════════════════════════════════════════════════

class CalcularTaxRequest(BaseModel):
    municipio: Optional[str] = "Andújar"
    clase: Optional[str] = "urbano"
    rc: Optional[str] = None
    sup_parcela: Optional[float] = 0
    valor_rep: Optional[float] = 0
    zona_valor: Optional[str] = None
    edif_max: Optional[float] = 0
    edif_real: Optional[float] = 0
    ha: Optional[float] = 0
    tipo_eval: Optional[float] = 0
    uso_suelo_rust: Optional[str] = "residencial"
    sup_ocupada: Optional[float] = 0
    uso_const: Optional[str] = "vivienda"
    categoria: Optional[int] = 3
    sup_const: Optional[float] = 0
    anio_const: Optional[int] = 2000
    estado: Optional[str] = "normal"
    # Campos personalizados para soporte universal
    custom_mbc: Optional[float] = None
    custom_mbr: Optional[float] = None
    custom_rm: Optional[float] = 0.50
    custom_tipo_urbano: Optional[float] = None
    custom_tipo_rustico: Optional[float] = None
    custom_anio_ponencia: Optional[int] = None

@app.post("/catastro/calcular-ibi")
async def calcular_ibi(request: CalcularTaxRequest):
    """
    Calcula el Valor Catastral y el IBI estimado.
    """
    try:
        params = request.dict()
        
        # Si hay RC, podríamos intentar obtener datos automáticamente
        # Pero por ahora usamos los parámetros enviados del frontend
        
        result = TaxCalculator.calculate(params)
        return result
    except Exception as e:
        print(f"Error en calculo IBI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/catastro/municipios-disponibles")
async def get_municipios():
    return list(MUNICIPALITIES.keys())

if __name__ == "__main__":
    import uvicorn
    import os
    # En Railway el puerto viene dado por la variable de entorno PORT
    port = int(os.environ.get("PORT", 8000))
    # Desactivar reload en producción y usar el puerto dinámico
    uvicorn.run("main:app", host="0.0.0.0", port=port)
