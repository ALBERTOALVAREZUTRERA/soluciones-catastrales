# Backend API - Conversor Catastral DXF ↔ GML

Backend Python con FastAPI para procesamiento de archivos catastrales con mejoras topológicas.

## Características

- ✅ **MEJORA 1**: Limpieza topológica automática (cierre de polígonos, eliminación de duplicados)
- ✅ **MEJORA 2**: Detección de conflictos topológicos (solapes no válidos)
- ✅ **Conversión Building (Edificios)**: Generación de GMLs de construcción según estándar INSPIRE (bu-ext2d)
- ✅ **Soporte Shapefile (ZIP)**: Lectura directa de archivos GIS comprimidos
- ✅ **Conversión de coordenadas**: UTM ↔ Lat/Lon (visualización web)
- ✅ **Detección de huecos**: Anidamiento automático de islas/huecos

## Instalación y Despliegue

### Local
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Producción (Gunicorn + Uvicorn)
Para el despliegue en servidores Linux (Railway, Render, VPS), usar:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

La API estará disponible en: `http://localhost:8000`

Documentación interactiva: `http://localhost:8000/docs`

## Endpoints

### POST `/analyze`
Analiza un archivo DXF y devuelve parcelas procesadas con:
- Coordenadas en UTM y Lat/Lon
- Detección de huecos
- Detección de conflictos
- Limpieza topológica automática

**Parámetros**:
- `file`: Archivo DXF (multipart/form-data)
- `epsg`: Código EPSG del sistema UTM (query param, default: "25830")

**Respuesta**:
```json
{
  "parcelas": [
    {
      "id": "4067926VH2137S",
      "referencia_catastral": "4067926VH2137S",
      "area": 1523.45,
      "coordenadas_utm": [[x, y], ...],
      "coordenadas_latlon": [[lon, lat], ...],
      "interiores_utm": [[[x, y], ...]],
      "interiores_latlon": [[[lon, lat], ...]],
      "has_conflict": false,
      "is_hole": false
    }
  ],
  "num_parcelas": 1,
  "num_conflictos": 0,
  "num_huecos": 2,
  "epsg_utm": "25830",
  "mensaje": "Análisis completado exitosamente"
}
```

### POST `/generate-gml`
Genera un archivo GML a partir de datos de parcelas (posiblemente editados).

**Request body**:
```json
{
  "parcelas": [...],
  "epsg": "25830"
}
```

**Respuesta**: Archivo GML (application/gml+xml)

### GET `/health`
Health check del servicio.

## Estructura del Motor (Core)

```
backend/core/
├── building_generator.py      # Generador Building GML (Inspire)
├── gml_generator.py           # Generador Parcela GML (CadastralParcel)
├── dxf_reader.py              # Motor de parsing DXF con stitching
├── shp_reader.py              # Motor de parsing de Shapefiles
├── conflict_detector.py       # Algoritmo de validación de solapes
└── coordinate_transformer.py  # Reproyección UTM (pyproj)
```

## Dependencias Principales

- `fastapi`: Framework web
- `uvicorn`: Servidor ASGI
- `ezdxf`: Lectura de archivos DXF
- `shapely`: Operaciones geométricas
- `pyproj`: Conversión de coordenadas
- `lxml`: Generación de XML/GML

## Notas de Desarrollo

- El código base está copiado del conversor desktop validado por Catastro
- La generación de GML usa esquemas INSPIRE CP 4.0 oficiales
- Los lints de importación son normales hasta que se instalen las dependencias
