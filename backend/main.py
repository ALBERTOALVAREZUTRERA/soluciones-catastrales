"""
Backend FastAPI para Visor/Conversor Catastral DXF ↔ GML
MEJORAS: Topología + Detección de Conflictos + Conversión coordenadas
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal, Optional
from contextvars import ContextVar
from datetime import datetime, timezone
import asyncio
import tempfile
import os
import re
import shutil
import json
import logging
import math
import time
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path

# Importar módulos core
from core.dxf_reader import DXFReader
from core.gml_generator import GMLGenerator
from core.parcel_model import ParcelaInfo, sanitizar_nombre_catastral
from core.conflict_detector import ConflictDetector
from core.coordinate_transformer import CoordinateTransformer
from core.kml_generator import generate_kml_from_gml_features
from core.tax_calculator import TaxCalculator, MUNICIPALITIES
from core.building_generator import BuildingGenerator
from core.dxf_generator import DXFGenerator
from core.shape_generator import ShapeGenerator
from core.file_security import (
    FileSecurityError,
    UploadTooLargeError,
    get_max_upload_bytes,
    save_upload_limited,
)
from core.catastro_client import (
    CatastroUpstreamError,
    cadastral_reference_from,
    catastro_error,
    child,
    child_text,
    elements,
    first_element,
    first_text,
    get_coordinates,
    get_property,
    get_reference_by_coordinates,
    get_rustic_property,
    normalize_cadastral_reference,
)

# Crear app FastAPI
app = FastAPI(
    title="API Conversor Catastral DXF ↔ GML",
    description="API REST para procesamiento de archivos catastrales con mejoras topológicas",
    version="1.0.0"
)

ALLOWED_EPSG = {"25829", "25830", "25831", "32628"}
MAX_GENERATION_PARCELS = 100
MAX_GENERATION_POINTS = 200_000
DEFAULT_MAX_JSON_REQUEST_BYTES = 16 * 1024 * 1024
MULTIPART_OVERHEAD_BYTES = 1024 * 1024
GIS_JOB_PATHS = frozenset({
    "/analyze",
    "/generate-gml",
    "/generate-kml",
    "/generate-kmz",
    "/generate-dxf",
    "/generate-shape",
    "/generate-building-gml",
})
REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{8,100}$")
request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
logger = logging.getLogger("catastro.api")
logger.setLevel(getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO))
if not logger.handlers:
    log_handler = logging.StreamHandler()
    log_handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(log_handler)
logger.propagate = False


def _bounded_env_int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw_value = os.getenv(name)
    if not raw_value:
        return default
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} debe ser un número entero") from exc
    if not minimum <= value <= maximum:
        raise RuntimeError(f"{name} debe estar entre {minimum} y {maximum}")
    return value


MAX_JSON_REQUEST_BYTES = _bounded_env_int(
    "MAX_JSON_REQUEST_BYTES",
    DEFAULT_MAX_JSON_REQUEST_BYTES,
    1024,
    64 * 1024 * 1024,
)
MAX_CONCURRENT_GIS_JOBS = _bounded_env_int(
    "MAX_CONCURRENT_GIS_JOBS",
    2,
    1,
    32,
)
GIS_QUEUE_TIMEOUT_MS = _bounded_env_int(
    "GIS_QUEUE_TIMEOUT_MS",
    2_000,
    100,
    30_000,
)
gis_job_slots = asyncio.Semaphore(MAX_CONCURRENT_GIS_JOBS)


def _request_id_from(request: Request) -> str:
    candidate = request.headers.get(REQUEST_ID_HEADER, "").strip()
    if REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate
    return uuid.uuid4().hex


def _error_code(status_code: int) -> str:
    return {
        400: "invalid_request",
        404: "not_found",
        413: "payload_too_large",
        422: "validation_error",
        429: "rate_limited",
        502: "upstream_unavailable",
        503: "service_unavailable",
    }.get(status_code, "internal_error" if status_code >= 500 else "request_failed")


def _error_payload(status_code: int, message: str, request_id: str) -> dict[str, str]:
    return {
        "error": message,
        "code": _error_code(status_code),
        "requestId": request_id,
    }


def _early_body_rejection(request: Request, request_id: str) -> JSONResponse | None:
    raw_length = request.headers.get("content-length")
    if raw_length is None:
        return None
    try:
        content_length = int(raw_length)
    except ValueError:
        content_length = -1
    if content_length < 0:
        return JSONResponse(
            status_code=400,
            content=_error_payload(
                400,
                "La cabecera Content-Length no es válida.",
                request_id,
            ),
            headers={"Cache-Control": "no-store"},
        )

    if request.url.path == "/analyze":
        limit = get_max_upload_bytes() + MULTIPART_OVERHEAD_BYTES
    elif request.url.path in GIS_JOB_PATHS:
        limit = MAX_JSON_REQUEST_BYTES
    else:
        return None

    if content_length <= limit:
        return None
    return JSONResponse(
        status_code=413,
        content=_error_payload(
            413,
            "La solicitud supera el tamaño máximo permitido.",
            request_id,
        ),
        headers={"Cache-Control": "no-store"},
    )


def _log_event(level: int, event: str, **fields: Any) -> None:
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "requestId": request_id_context.get(),
        **fields,
    }
    logger.log(level, json.dumps(payload, ensure_ascii=False, separators=(",", ":")))


@app.middleware("http")
async def observe_request(request: Request, call_next):
    request_id = _request_id_from(request)
    request.state.request_id = request_id
    token = request_id_context.set(request_id)
    started_at = time.perf_counter()
    slot_acquired = False
    try:
        try:
            response = _early_body_rejection(request, request_id)
            if response is None and request.url.path in GIS_JOB_PATHS:
                try:
                    await asyncio.wait_for(
                        gis_job_slots.acquire(),
                        timeout=GIS_QUEUE_TIMEOUT_MS / 1000,
                    )
                    slot_acquired = True
                except asyncio.TimeoutError:
                    response = JSONResponse(
                        status_code=503,
                        content={
                            **_error_payload(
                                503,
                                "El servicio está ocupado. Inténtelo de nuevo en unos segundos.",
                                request_id,
                            ),
                            "code": "capacity_exhausted",
                        },
                        headers={
                            "Cache-Control": "no-store",
                            "Retry-After": "2",
                        },
                    )
            if response is None:
                response = await call_next(request)
        except Exception as exc:
            _log_event(
                logging.ERROR,
                "unhandled_request_error",
                method=request.method,
                path=request.url.path,
                errorType=type(exc).__name__,
            )
            response = JSONResponse(
                status_code=500,
                content=_error_payload(
                    500,
                    "No se pudo completar la solicitud.",
                    request_id,
                ),
                headers={"Cache-Control": "no-store"},
            )

        response.headers[REQUEST_ID_HEADER] = request_id
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        _log_event(
            logging.INFO if response.status_code < 500 else logging.ERROR,
            "request_completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            durationMs=duration_ms,
        )
        return response
    finally:
        if slot_acquired:
            gis_job_slots.release()
        request_id_context.reset(token)


@app.exception_handler(StarletteHTTPException)
async def http_exception_response(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", uuid.uuid4().hex)
    if exc.status_code >= 500:
        message = "No se pudo completar la solicitud."
        cause = exc.__cause__
        _log_event(
            logging.ERROR,
            "handled_server_error",
            method=request.method,
            path=request.url.path,
            status=exc.status_code,
            errorType=type(cause).__name__ if cause else type(exc).__name__,
        )
    else:
        message = exc.detail if isinstance(exc.detail, str) else "La solicitud no es válida."
    headers = dict(exc.headers or {})
    headers.setdefault("Cache-Control", "no-store")
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.status_code, message, request_id),
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_response(request: Request, _exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", uuid.uuid4().hex)
    return JSONResponse(
        status_code=422,
        content=_error_payload(
            422,
            "Revise los datos enviados.",
            request_id,
        ),
        headers={"Cache-Control": "no-store"},
    )


def _cleanup_temp_dir(temp_dir: Optional[str]) -> None:
    if temp_dir:
        shutil.rmtree(temp_dir, ignore_errors=True)


def _stream_file_response(
    file_path: str,
    temp_dir: str,
    media_type: str,
    download_name: str,
) -> StreamingResponse:
    safe_download_name = re.sub(
        r"[^A-Za-z0-9._-]",
        "_",
        Path(download_name).name,
    ) or "descarga"

    def file_iterator():
        with open(file_path, "rb") as file_handle:
            yield from file_handle

    return StreamingResponse(
        file_iterator(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_download_name}"'},
        background=BackgroundTask(_cleanup_temp_dir, temp_dir),
    )


def _normalize_epsg(value: Any) -> str:
    epsg = str(value).upper().replace("EPSG:", "")
    if epsg not in ALLOWED_EPSG:
        raise HTTPException(status_code=400, detail="Sistema de coordenadas EPSG no soportado")
    return epsg


def _count_coordinate_points(value: Any) -> int:
    if not isinstance(value, list):
        return 0
    if (
        len(value) >= 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    ):
        return 1
    return sum(_count_coordinate_points(item) for item in value)


def _validate_ring(ring: Any, field_name: str, latlon: bool = False) -> None:
    if not isinstance(ring, list) or len(ring) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} debe contener al menos tres vértices",
        )
    distinct_points = set()
    for coordinate in ring:
        if (
            not isinstance(coordinate, list)
            or len(coordinate) < 2
            or isinstance(coordinate[0], bool)
            or isinstance(coordinate[1], bool)
            or not isinstance(coordinate[0], (int, float))
            or not isinstance(coordinate[1], (int, float))
            or not math.isfinite(coordinate[0])
            or not math.isfinite(coordinate[1])
        ):
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} contiene una coordenada no válida",
            )
        x, y = float(coordinate[0]), float(coordinate[1])
        if latlon and not (-180 <= x <= 180 and -90 <= y <= 90):
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} contiene una longitud o latitud fuera de rango",
            )
        distinct_points.add((round(x, 8), round(y, 8)))
    if len(distinct_points) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} debe contener al menos tres vértices distintos",
        )


def _validate_generation_request(request: "GenerateGMLRequest") -> None:
    if not request.parcelas:
        raise HTTPException(status_code=400, detail="No se enviaron parcelas")
    if len(request.parcelas) > MAX_GENERATION_PARCELS:
        raise HTTPException(
            status_code=413,
            detail=f"No se admiten más de {MAX_GENERATION_PARCELS} parcelas por operación",
        )

    total_points = 0
    coordinate_fields = (
        "coordenadas_utm",
        "coordenadas_latlon",
        "interiores_utm",
        "interiores_latlon",
    )
    identifiers = set()
    for parcel_index, parcela in enumerate(request.parcelas):
        total_points += sum(
            _count_coordinate_points(parcela.get(field, []))
            for field in coordinate_fields
        )
        if total_points > MAX_GENERATION_POINTS:
            raise HTTPException(
                status_code=413,
                detail=f"La operación supera el límite de {MAX_GENERATION_POINTS} coordenadas",
            )
        exterior_utm = parcela.get("coordenadas_utm", [])
        exterior_latlon = parcela.get("coordenadas_latlon", [])
        if not exterior_utm and not exterior_latlon:
            raise HTTPException(
                status_code=400,
                detail="Cada parcela debe incluir coordenadas UTM o geográficas",
            )
        if exterior_utm:
            _validate_ring(exterior_utm, "coordenadas_utm")
        if exterior_latlon:
            _validate_ring(exterior_latlon, "coordenadas_latlon", latlon=True)
        for index, hole in enumerate(parcela.get("interiores_utm", [])):
            _validate_ring(hole, f"interiores_utm[{index}]")
        for index, hole in enumerate(parcela.get("interiores_latlon", [])):
            _validate_ring(hole, f"interiores_latlon[{index}]", latlon=True)
        area = parcela.get("area", 0)
        if (
            isinstance(area, bool)
            or not isinstance(area, (int, float))
            or not math.isfinite(area)
            or area < 0
        ):
            raise HTTPException(status_code=400, detail="El área de la parcela no es válida")
        if "numero_plantas" in parcela:
            floors = parcela["numero_plantas"]
            if (
                isinstance(floors, bool)
                or not isinstance(floors, int)
                or not 1 <= floors <= 200
            ):
                raise HTTPException(
                    status_code=400,
                    detail="El número de plantas debe ser un entero entre 1 y 200",
                )
        raw_id = str(parcela.get("id") or f"PARCELA_{parcel_index + 1}").strip()
        if len(raw_id) > 100 or any(ord(character) < 32 for character in raw_id):
            raise HTTPException(
                status_code=400,
                detail="El identificador de la parcela no es válido",
            )
        raw_reference = str(parcela.get("referencia_catastral") or "")
        normalized_reference = re.sub(r"\s+", "", raw_reference).upper()
        if normalized_reference and not re.fullmatch(
            r"(?:[A-Z0-9]{14}|[A-Z0-9]{18}|[A-Z0-9]{20})",
            normalized_reference,
        ):
            raise HTTPException(
                status_code=400,
                detail="La referencia catastral de la exportación no es válida",
            )
        parcela["referencia_catastral"] = normalized_reference
        identifier = sanitizar_nombre_catastral(normalized_reference or raw_id)
        if identifier in identifiers:
            raise HTTPException(
                status_code=400,
                detail="Las parcelas de una misma exportación deben tener identificadores únicos",
            )
        identifiers.add(identifier)


def _extract_utm_geometry(
    parcela: Dict[str, Any],
    epsg: str,
    exterior_clockwise: bool = False,
):
    if parcela.get("coordenadas_utm"):
        exterior = [(c[0], c[1]) for c in parcela["coordenadas_utm"]]
    else:
        exterior = CoordinateTransformer.latlon_to_utm(
            [(c[0], c[1]) for c in parcela.get("coordenadas_latlon", [])],
            epsg,
        )

    if parcela.get("interiores_utm"):
        holes = [
            [(c[0], c[1]) for c in hole]
            for hole in parcela["interiores_utm"]
        ]
    else:
        holes = [
            CoordinateTransformer.latlon_to_utm(
                [(c[0], c[1]) for c in hole],
                epsg,
            )
            for hole in parcela.get("interiores_latlon", [])
        ]
    return GMLGenerator.prepare_polygon(
        exterior,
        holes,
        exterior_clockwise=exterior_clockwise,
    )

# Configurar CORS de forma explícita en producción.
app_env = os.getenv("APP_ENV", "development").strip().lower()
default_origins = "http://localhost:9002,http://localhost:3000"
admitted_origins_str = os.getenv("ADMITTED_ORIGINS", default_origins)
allow_origins = [orig.strip() for orig in admitted_origins_str.split(",") if orig.strip() and orig.strip() != "*"]

if app_env == "production" and not os.getenv("ADMITTED_ORIGINS", "").strip():
    raise RuntimeError("ADMITTED_ORIGINS es obligatorio cuando APP_ENV=production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[REQUEST_ID_HEADER],
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
from core.kml_reader import KMLReader

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_file(
    file: UploadFile = File(...),
    epsg: str = Query("25830", description="Código EPSG del sistema UTM (25829, 25830, 25831, 32628)"),
    tipo_entidad: str = Query("CP", description="Tipo de entidad: CP (Parcela) o BU (Edificio)")
):
    """
    Analiza un archivo DXF, ZIP (Shapefile) o KMZ y devuelve parcelas/edificios.
    """
    
    filename = Path(file.filename or "").name.lower()
    if not (filename.endswith('.dxf') or filename.endswith('.zip') or filename.endswith('.kmz') or filename.endswith('.kml')):
        raise HTTPException(status_code=400, detail="El archivo debe ser DXF, ZIP (Shapefile) o KMZ/KML")

    epsg = _normalize_epsg(epsg)

    tipo_entidad = tipo_entidad.upper()
    if tipo_entidad not in {"CP", "BU"}:
        raise HTTPException(status_code=400, detail="El tipo de entidad debe ser CP o BU")

    tmp_path = None
    try:
        # Guardar archivo temporalmente
        if filename.endswith('.zip'):
            suffix = '.zip'
        elif filename.endswith('.kmz') or filename.endswith('.kml'):
            suffix = '.kmz' if filename.endswith('.kmz') else '.kml'
        else:
            suffix = '.dxf'
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            await save_upload_limited(file, tmp_file)
            tmp_path = tmp_file.name
        
        parcelas = []
        is_dxf = filename.endswith('.dxf')
        if filename.endswith('.zip'):
            # 1. Leer de Shapefile (ZIP)
            parcelas = SHPReader.leer_desde_zip(tmp_path, epsg)
        elif filename.endswith('.kmz') or filename.endswith('.kml'):
            # 1.5. Leer de KML/KMZ
            parcelas = KMLReader.leer_desde_kmz(tmp_path, epsg)
        else:
            # 2. Leer de DXF
            # Obtener capas del DXF
            capas_info = DXFReader.obtener_capas_con_detalle(tmp_path)
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
            
            # Leer parcelas/edificios del DXF
            parcelas = DXFReader.leer_borde_parcelas(tmp_path, capas_parcelas, capa_textos)
        if not parcelas:
            raise ValueError("No se encontraron polígonos válidos en el archivo")
        
        # Asignar tipo de entidad y asegurar nombre de archivo original
        base_filename = os.path.splitext(Path(file.filename or "archivo").name)[0]
        for p in parcelas:
            p.tipo_entidad = tipo_entidad
            # Si el nombre detectado es genérico o nulo, usar el del archivo original
            if not p.nombre_archivo or "TMP" in p.nombre_archivo.upper() or "PARCELA_" in p.nombre_archivo.upper():
                p.nombre_archivo = base_filename
            
            # Asegurar que nombre_original tenga el nombre real del archivo (sin prefijos temporales)
            p.nombre_original = base_filename
        
        # 3. MEJORA 1: Limpieza topológica
        parcelas = DXFReader.limpiar_topologia(parcelas)

        # Solo el DXF necesita inferir huecos a partir de anillos separados.
        # SHP y KML ya expresan sus anillos interiores en el propio formato.
        anidamientos = DXFReader.detect_nesting(parcelas) if is_dxf else {}
        
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
        # Recalcular área y validez después de incorporar huecos.
        parcelas = DXFReader.limpiar_topologia(parcelas)
        
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
        
        return AnalyzeResponse(
            parcelas=parcelas_response,
            num_parcelas=len(parcelas),
            num_conflictos=num_conflictos,
            num_huecos=num_huecos,
            epsg_utm=epsg,
            mensaje="Análisis completado exitosamente"
        )
    except UploadTooLargeError as e:
        raise HTTPException(status_code=413, detail=str(e)) from e
    except FileSecurityError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="No se pudo procesar el archivo importado",
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/generate-gml")
async def generate_gml(request: GenerateGMLRequest):
    """
    Genera un archivo GML a partir de datos de parcelas (posiblemente editados por el usuario)
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        
        # Crear directorio temporal para GML
        temp_dir = tempfile.mkdtemp()
        
        # Convertir datos JSON a ParcelaInfo
        parcelas = []
        for parcel_index, p_data in enumerate(request.parcelas):
            parcela = ParcelaInfo()
            parcela.referencia_catastral = p_data.get('referencia_catastral', '')
            parcela.nombre_archivo = p_data.get('id', f'parcela_{parcel_index + 1}')
            parcela.area = p_data.get('area', 0.0)
            parcela.coordenadas, parcela.interiores, parcela.area = _extract_utm_geometry(
                p_data,
                request.epsg,
            )
            
            parcelas.append(parcela)
        
        # Generar GML para cada parcela
        gml_paths = []
        for parcela in parcelas:
            gml_path = GMLGenerator.generar_gml(parcela, temp_dir, usar_epsg_urn=True, epsg_code=request.epsg)
            gml_paths.append(gml_path)
        
        # Si es una sola parcela, devolver ese GML
        # Si son múltiples, podríamos combinarlas o devolver un ZIP
        if len(gml_paths) == 1:
            filename = os.path.basename(gml_paths[0])
            return _stream_file_response(
                gml_paths[0],
                temp_dir,
                "application/gml+xml",
                filename,
            )
        else:
            combined_path = os.path.join(temp_dir, "parcelas_catastrales.gml")
            combined_tree = ET.parse(gml_paths[0])
            combined_root = combined_tree.getroot()
            member_tag = "{http://www.opengis.net/wfs/2.0}member"
            for path in gml_paths[1:]:
                source_root = ET.parse(path).getroot()
                for member in list(source_root.findall(member_tag)):
                    combined_root.append(member)
            combined_root.set("numberMatched", str(len(gml_paths)))
            combined_root.set("numberReturned", str(len(gml_paths)))
            combined_tree.write(combined_path, encoding="UTF-8", xml_declaration=True)
            return _stream_file_response(
                combined_path,
                temp_dir,
                "application/gml+xml",
                "parcelas_catastrales.gml",
            )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el GML") from e


@app.post("/generate-kml")
async def generate_kml(request: GenerateGMLRequest):
    """
    Genera un archivo KML para visualización en Google Earth.
    Las parcelas incluyen estilos diferenciados y soporte para huecos.
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        
        # Preparar features en formato compatible
        features = []
        
        for p_data in request.parcelas:
            # Convertir coordenadas lat/lon de vuelta a UTM para el transformador
            coords_utm, holes_utm, geometry_area = _extract_utm_geometry(p_data, request.epsg)
            geometry = [coords_utm, *holes_utm]
            
            feature = {
                'id': p_data.get('id', 'Sin ID'),
                'geometry': geometry,
                'area': geometry_area,
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
        kml_file = generate_kml_from_gml_features(features, kml_path, epsg=request.epsg)        
        return _stream_file_response(
            kml_file,
            temp_dir,
            "application/vnd.google-earth.kml+xml",
            "parcelas_catastro.kml",
        )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el KML") from e


@app.post("/generate-kmz")
async def generate_kmz(request: GenerateGMLRequest):
    """
    Exporta las parcelas actuales a formato KMZ (KML Comprimido).
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        temp_dir = tempfile.mkdtemp()
        kmz_file = os.path.join(temp_dir, "parcelas_catastro.kmz")
        
        # Preparar features formato GmlFeature
        features = []
        for p_data in request.parcelas:
            # Asegurar estructura correcta para KMLGenerator
            exterior_utm, holes_utm, geometry_area = _extract_utm_geometry(p_data, request.epsg)
            features.append({
                'id': p_data.get('id', 'S/N'),
                'geometry': [exterior_utm, *holes_utm],
                'area': geometry_area,
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'hasConflict': p_data.get('has_conflict', False),
                'isHole': p_data.get('is_hole', False)
            })
            
        generate_kml_from_gml_features(features, kmz_file, request.epsg)
        
        return _stream_file_response(
            kmz_file,
            temp_dir,
            "application/vnd.google-earth.kmz",
            "parcelas_catastro.kmz",
        )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el KMZ") from e


@app.post("/generate-dxf")
async def generate_dxf(request: GenerateGMLRequest):
    """
    Exporta las parcelas actuales a formato DXF.
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        
        temp_dir = tempfile.mkdtemp()
        dxf_path = os.path.join(temp_dir, "exportacion_catastral.dxf")
        
        # Preparar features
        features = []
        for p_data in request.parcelas:
            coords_utm, holes_utm, geometry_area = _extract_utm_geometry(p_data, request.epsg)
            geometry = [coords_utm, *holes_utm]
                
            features.append({
                'id': p_data.get('id', 'S/N'),
                'geometry': geometry,
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'area': geometry_area
            })
            
        final_path = DXFGenerator.exportar_a_dxf(features, dxf_path, request.epsg)
        
        return _stream_file_response(
            final_path,
            temp_dir,
            "application/dxf",
            "parcelas_catastro.dxf",
        )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el DXF") from e


@app.post("/generate-shape")
async def generate_shape(request: GenerateGMLRequest):
    """
    Exporta las parcelas actuales a formato Shapefile (ZIP).
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        
        temp_dir = tempfile.mkdtemp()
        base_name = "exportacion_catastral"
        shp_base_path = os.path.join(temp_dir, base_name)
        
        # Preparar features
        features = []
        for p_data in request.parcelas:
            coords_utm, holes_utm, geometry_area = _extract_utm_geometry(
                p_data,
                request.epsg,
                exterior_clockwise=True,
            )
            geometry = [coords_utm, *holes_utm]
                
            features.append({
                'id': p_data.get('id', 'S/N'),
                'geometry': geometry,
                'cadastralReference': p_data.get('referencia_catastral', ''),
                'area': geometry_area
            })
            
        ShapeGenerator.exportar_a_shape(features, shp_base_path, request.epsg)
        
        # Crear ZIP con todos los componentes obligatorios y la codificación.
        zip_path = os.path.join(temp_dir, f"{base_name}.zip")
        import zipfile
        extensions = ['.shp', '.shx', '.dbf', '.prj', '.cpg']
        missing_outputs = [
            ext for ext in extensions
            if not os.path.isfile(shp_base_path + ext)
        ]
        if missing_outputs:
            raise RuntimeError("El generador no produjo un Shapefile completo")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for ext in extensions:
                f_path = shp_base_path + ext
                zipf.write(f_path, base_name + ext)
        
        return _stream_file_response(
            zip_path,
            temp_dir,
            "application/zip",
            "parcelas_catastro.zip",
        )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el Shapefile") from e


@app.post("/generate-building-gml")
async def generate_building_gml(request: GenerateGMLRequest):
    """
    Genera GML de Edificio (INSPIRE Building) para las parcelas enviadas.
    """
    temp_dir = None
    try:
        _validate_generation_request(request)
        request.epsg = _normalize_epsg(request.epsg)
        
        temp_dir = tempfile.mkdtemp()
        
        p_data = request.parcelas[0]
        parcela = ParcelaInfo()
        parcela.nombre_archivo = p_data.get('id', 'edificio')
        # Preservamos el nombre original para el nombre del archivo GML
        parcela.nombre_original = p_data.get('nombre_archivo', '')
        parcela.referencia_catastral = p_data.get('referencia_catastral', '')
        parcela.area = p_data.get('area', 0.0)
        parcela.numero_plantas = max(
            part.get("numero_plantas", 1)
            for part in request.parcelas
        )
        
        # Un edificio puede estar formado por varias huellas disjuntas.
        parcela.partes = []
        total_area = 0.0
        for part in request.parcelas:
            exterior, holes, part_area = _extract_utm_geometry(
                part,
                request.epsg,
                exterior_clockwise=True,
            )
            parcela.partes.append({"exterior": exterior, "huecos": holes})
            total_area += part_area
        parcela.area = round(total_area, 2)
        parcela.coordenadas = parcela.partes[0]["exterior"]
        parcela.interiores = parcela.partes[0]["huecos"]
            
        gml_file = BuildingGenerator.generar_gml_edificio(parcela, temp_dir, request.epsg)
        
        return _stream_file_response(
            gml_file,
            temp_dir,
            "application/gml+xml",
            os.path.basename(gml_file),
        )
    except HTTPException:
        _cleanup_temp_dir(temp_dir)
        raise
    except ValueError as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        _cleanup_temp_dir(temp_dir)
        raise HTTPException(status_code=500, detail="No se pudo generar el GML de edificio") from e


# ══════════════════════════════════════════════════════════════════════
# PROXY CATASTRO: Búsqueda de parcelas por referencia catastral
# ══════════════════════════════════════════════════════════════════════

class BuscarRCRequest(BaseModel):
    referencia_catastral: str

class BuscarRusticaRequest(BaseModel):
    provincia: str = Field(min_length=1, max_length=25)
    municipio: str = Field(min_length=1, max_length=40)
    poligono: str = Field(pattern=r"^\d{1,3}$")
    parcela: str = Field(pattern=r"^\d{1,5}$")


def _catastro_float(root, name: str) -> float:
    try:
        value = first_text(root, name).replace(",", ".")
        number = float(value)
        return number if math.isfinite(number) else 0.0
    except (TypeError, ValueError):
        return 0.0


@app.post("/catastro/buscar-rc")
def buscar_por_referencia_catastral(request: BuscarRCRequest):
    """
    Consulta los servicios WCF/REST libres del Catastro y localiza la finca.
    """
    try:
        rc_original = normalize_cadastral_reference(request.referencia_catastral)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    rc = rc_original[:14]

    try:
        property_root = get_property(rc_original)
        error_datos = catastro_error(property_root)
        if error_datos:
            return {"encontrado": False, "error": f"Catastro: {error_datos}"}

        candidates = list(elements(property_root, "rcdnp"))
        candidate_count = len(candidates)
        ambiguous = candidate_count > 1
        if first_element(property_root, "bico") is None and candidates:
            first_reference = cadastral_reference_from(candidates[0], full=True)
            if len(first_reference) in (18, 20):
                property_root = get_property(first_reference)
                detailed_error = catastro_error(property_root)
                if detailed_error:
                    return {
                        "encontrado": False,
                        "error": f"Catastro: {detailed_error}",
                    }

        coordinate_root = get_coordinates(rc)
        error_coord = catastro_error(coordinate_root)
        if error_coord:
            return {"encontrado": False, "error": f"Catastro: {error_coord}"}

        lon = _catastro_float(coordinate_root, "xcen")
        lat = _catastro_float(coordinate_root, "ycen")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90) or (lon == 0 and lat == 0):
            return {
                "encontrado": False,
                "error": "No se encontraron coordenadas para esta referencia catastral"
            }

        bico = first_element(property_root, "bico")
        building = child(bico, "bi")
        address_data = child(building, "dt")
        property_data = child(building, "debi")
        estate = child(bico, "finca")
        direccion = child_text(building, "ldt") or first_text(
            coordinate_root,
            "ldt",
        )
        municipio_result = first_text(address_data, "nm")
        provincia_result = first_text(address_data, "np")
        uso = child_text(property_data, "luso")
        superficie_parcela = max(
            _catastro_float(estate, "ss"),
            _catastro_float(estate, "spt"),
            _catastro_float(estate, "supf"),
        )
        superficie_construida = _catastro_float(property_data, "sfc")
        try:
            anio_const = int(child_text(property_data, "ant", "0"))
        except ValueError:
            anio_const = 0
        if ambiguous:
            # Una referencia de finca puede representar varios inmuebles. No
            # atribuimos a toda la finca los datos constructivos del primero.
            uso = ""
            superficie_construida = 0.0
            anio_const = 0

        # 4. Detectar zona de valoración vía WMS + fallback por distancia al centro
        zona_detectada = TaxCalculator.get_valuation_zone(lat, lon)

        # Normalizar nombre municipio para buscar en MUNICIPALITIES
        import unicodedata
        def norm(t): return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn').lower()
        muni_norm = norm(municipio_result)
        muni_key = next((k for k in MUNICIPALITIES if norm(k) == muni_norm), None)

        # Si WMS no detectó zona, intentar fallback geográfico para Andújar
        if not zona_detectada and muni_key == "Andújar":
            # Distancias aproximadas al centro de Andújar (Plaza de España: 38.0438, -4.0484)
            # R37/R37C: < 200m  |  R40: < 450m  |  R43: < 900m  |  R47: < 1800m  |  R50+: resto
            import math
            def haversine_m(lat1, lon1, lat2, lon2):
                R = 6371000
                φ1, φ2 = math.radians(lat1), math.radians(lat2)
                dφ = math.radians(lat2 - lat1)
                dλ = math.radians(lon2 - lon1)
                a = math.sin(dφ/2)**2 + math.cos(φ1)*math.cos(φ2)*math.sin(dλ/2)**2
                return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

            dist = haversine_m(lat, lon, 38.0438, -4.0484)
            if dist < 200:
                zona_detectada = "R37C"
            elif dist < 450:
                zona_detectada = "R40"
            elif dist < 900:
                zona_detectada = "R43"
            elif dist < 1800:
                zona_detectada = "R47"
            elif dist < 3000:
                zona_detectada = "R50"
            else:
                zona_detectada = "R55"

        valor_rep = 0.0
        zona_info = ""
        if zona_detectada and muni_key:
            # Mapear uso catastral al key de zonas_valor
            uso_map = "vivienda"
            uso_lower = uso.lower()
            if "industrial" in uso_lower or "almacén" in uso_lower or "almacen" in uso_lower:
                uso_map = "industri"
            elif "oficina" in uso_lower:
                uso_map = "oficinas"
            elif "comercio" in uso_lower or "local" in uso_lower:
                uso_map = "comercial"
            elif "garaje" in uso_lower or "aparcamiento" in uso_lower:
                uso_map = "garajes"

            valor_rep = TaxCalculator.get_zone_value(muni_key, zona_detectada, uso_map)
            if valor_rep > 0:
                zona_info = f"Zona {zona_detectada} — {valor_rep:.2f} €/m² ({uso_map})"

        return {
            "encontrado": True,
            "rc": rc_original,
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
            "valor_rep": valor_rep,
            "zona_info": zona_info,
            "seleccion_aproximada": ambiguous,
            "num_inmuebles": candidate_count or 1,
        }

    except CatastroUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo interpretar la respuesta del Catastro",
        ) from exc


@app.post("/catastro/buscar-rustica")
def buscar_parcela_rustica(request: BuscarRusticaRequest):
    """
    Proxy para buscar parcela rústica por provincia/municipio/polígono/parcela.
    """
    try:
        property_root = get_rustic_property(
            request.provincia.strip(),
            request.municipio.strip(),
            request.poligono,
            request.parcela,
        )
        error = catastro_error(property_root)
        if error:
            return {"encontrado": False, "error": f"Catastro: {error}"}
        rc = cadastral_reference_from(property_root)
        if len(rc) != 14:
            return {"encontrado": False, "error": "Parcela rústica no encontrada"}

        coordinate_root = get_coordinates(rc)
        coordinate_error = catastro_error(coordinate_root)
        if coordinate_error:
            return {
                "encontrado": False,
                "error": f"Catastro: {coordinate_error}",
            }
        lon = _catastro_float(coordinate_root, "xcen")
        lat = _catastro_float(coordinate_root, "ycen")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90) or (lon == 0 and lat == 0):
            return {"encontrado": False, "error": "Parcela encontrada pero sin coordenadas"}
        return {
            "encontrado": True,
            "rc": rc,
            "lat": lat,
            "lon": lon,
            "municipio": request.municipio,
            "provincia": request.provincia,
            "poligono": request.poligono,
            "parcela": request.parcela,
        }
    except CatastroUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo interpretar la respuesta del Catastro",
        ) from exc

class BuscarCoordsRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)

@app.post("/catastro/buscar-por-coordenadas")
def buscar_por_coordenadas(request: BuscarCoordsRequest):
    """
    Busca una referencia catastral a partir de longitud y latitud.
    """
    try:
        coordinate_root = get_reference_by_coordinates(request.lat, request.lon)
        error_catastro = catastro_error(coordinate_root)
        if error_catastro:
            return {"encontrado": False, "error": f"Catastro: {error_catastro}"}

        rc_base = cadastral_reference_from(coordinate_root)
        if len(rc_base) == 14:
            return {
                "encontrado": True,
                "rc": rc_base,
                "direccion": first_text(coordinate_root, "ldt"),
            }
        return {
            "encontrado": False,
            "error": "Las coordenadas no caen sobre una parcela catastral disponible",
        }
    except CatastroUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo interpretar la respuesta del Catastro",
        ) from exc


# ══════════════════════════════════════════════════════════════════════
# CALCULADORA CATASTRAL E IBI
# ══════════════════════════════════════════════════════════════════════

class CalcularTaxRequest(BaseModel):
    municipio: Optional[str] = "Andújar"
    clase: Literal["urbano", "rustico"] = "urbano"
    rc: Optional[str] = None
    sup_parcela: float = Field(default=0, ge=0)
    valor_rep: float = Field(default=0, ge=0)
    zona_valor: Optional[str] = None
    edif_max: float = Field(default=0, ge=0)
    edif_real: float = Field(default=0, ge=0)
    ha: float = Field(default=0, ge=0)
    tipo_eval: float = Field(default=0, ge=0)
    uso_suelo_rust: Optional[str] = "residencial"
    sup_ocupada: float = Field(default=0, ge=0)
    uso_const: Optional[str] = "vivienda"
    categoria: int = Field(default=3, ge=1, le=9)
    sup_const: float = Field(default=0, ge=0)
    anio_const: int = Field(default=2000, ge=1000, le=2200)
    estado: Literal["normal", "regular", "deficiente", "ruinoso"] = "normal"
    # Campos personalizados para soporte universal
    custom_mbc: Optional[float] = Field(default=None, gt=0)
    custom_mbr: Optional[float] = Field(default=None, gt=0)
    custom_mbr_rustico: Optional[float] = Field(default=None, gt=0)
    custom_rm: Optional[float] = Field(default=None, gt=0)
    custom_gb: Optional[float] = Field(default=None, gt=0)
    custom_tipo_urbano: Optional[float] = Field(default=None, ge=0, le=1)
    custom_tipo_rustico: Optional[float] = Field(default=None, ge=0, le=1)
    custom_anio_ponencia: Optional[int] = Field(default=None, ge=1900, le=2200)

@app.post("/catastro/calcular-ibi")
async def calcular_ibi(request: CalcularTaxRequest):
    """
    Calcula el Valor Catastral y el IBI estimado.
    """
    params = request.model_dump()

    # Si hay RC, podríamos intentar obtener datos automáticamente.
    # Por ahora usamos los parámetros enviados desde el frontend.
    try:
        return TaxCalculator.calculate(params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

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
