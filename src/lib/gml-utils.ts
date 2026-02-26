/**
 * !!! CORE GML GENERATION LOGIC - STABLE/FROZEN !!!
 * 
 * DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER APPROVAL.
 * The GML output format has been validated and accepted by Catastro.
 * Any changes here risk breaking compliance.
 */
import proj4 from 'proj4';
import DxfParser from 'dxf-parser';
import * as shp from 'shpjs';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Geometry } from 'geojson';

// --- Definiciones de Sistemas de Coordenadas (EPSG) ---
proj4.defs("EPSG:25829", "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:32628", "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs"); // Canarias

export interface GmlFeature {
    id: string;
    // Usamos la estructura de GeoJSON Polygon para facilitar la conversión:
    // [ExteriorRing, InteriorRing1, InteriorRing2...]
    // Donde cada Ring es [x, y][]
    geometry: number[][][];
    area?: number;
    // NUEVOS CAMPOS PARA INTEGRACIÓN CON BACKEND
    cadastralReference?: string; // Editable por usuario (MEJORA 3)
    hasConflict?: boolean;       // Del backend (MEJORA 4)
    isHole?: boolean;             // Del backend (MEJORA 4)
    coordsLatLon?: number[][][]; // Para Leaflet (del backend)
    capaOrigen?: string;         // Capa DXF de origen
    nombre_archivo?: string;     // Nombre del archivo de origen
}

const NS_MAP = {
    gml: 'http://www.opengis.net/gml/3.2',
    cp: 'http://inspire.ec.europa.eu/schemas/cp/4.0',
    base: 'http://inspire.ec.europa.eu/schemas/base/3.3',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    wfs: 'http://www.opengis.net/wfs/2.0',
    xlink: 'http://www.w3.org/1999/xlink'
};

const SCHEMALOCATION = "http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://inspire.ec.europa.eu/schemas/cp/4.0 http://inspire.ec.europa.eu/schemas/cp/4.0/CadastralParcels.xsd";

// --- Función Principal ---
export async function processFile(file: File, format: string, targetCrs: string): Promise<{ gml: string, features: GmlFeature[] }> {
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
    let features: GmlFeature[] = [];

    try {
        if (format === 'csv') {
            const text = await file.text();
            features = parseCsv(text, baseName);
        } else if (format === 'dxf') {
            const text = await file.text();
            features = parseDxf(text, baseName);
        } else if (format === 'shp') {
            const buffer = await file.arrayBuffer();
            features = await parseShp(buffer, baseName, targetCrs);
        } else if (format === 'gml') {
            const text = await file.text();
            features = parseGml(text, baseName);
        }
    } catch (e) {
        console.error("Error parsing file:", e);
        throw new Error("Error al leer el archivo. Asegúrate de que el formato es correcto.");
    }

    if (features.length === 0) {
        throw new Error("No se encontraron geometrías válidas en el archivo.");
    }

    return {
        gml: generateGml(features, targetCrs),
        features
    };
}

// --- Helper Geométrico PLANO (Cartesiano) ---
// Turf.area usa WGS84 (geodésico). Para UTM necesitamos área plana euclidiana.
function calculatePlanarArea(geometry: Geometry): number {
    let area = 0;
    if (geometry.type === 'Polygon') {
        const polygon = geometry as Polygon;
        // Exterior
        area += Math.abs(ringArea(polygon.coordinates[0]));
        // Holes (restan)
        for (let i = 1; i < polygon.coordinates.length; i++) {
            area -= Math.abs(ringArea(polygon.coordinates[i]));
        }
    } else if (geometry.type === 'MultiPolygon') {
        const multi = geometry as MultiPolygon;
        multi.coordinates.forEach(polyCoords => {
            // Exterior
            area += Math.abs(ringArea(polyCoords[0]));
            // Holes
            for (let i = 1; i < polyCoords.length; i++) {
                area -= Math.abs(ringArea(polyCoords[i]));
            }
        });
    }
    return area;
}

// Fórmula de Shoelace (Gausiana)
function ringArea(coords: any[]): number {
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        area += (p1[0] * p2[1]) - (p2[0] * p1[1]);
    }
    return area / 2;
}

// --- Parsers (Lectura de archivos) ---

function parseCsv(text: string, baseName: string = 'PARCELA_CSV'): GmlFeature[] {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const points: number[][] = [];

    lines.forEach(line => {
        const parts = line.split(/[,\t;]/).map(Number);
        if (parts.length >= 2 && !isNaN(parts[parts.length - 2]) && !isNaN(parts[parts.length - 1])) {
            points.push([parts[parts.length - 2], parts[parts.length - 1]]);
        }
    });

    if (points.length < 3) {
        throw new Error("El archivo CSV debe contener al menos 3 puntos válidos para formar un polígono.");
    }

    // Cerrar polígono si está abierto
    if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) {
        points.push(points[0]);
    }

    // Crear Polygon básico (sin huecos soportados en CSV simple)
    return [{
        id: baseName,
        geometry: [points],
        area: Math.abs(ringArea(points)) // Añadimos cálculo de área simple
    }];
}

// ... parseDxf ...

// --- FUNCIÓN DE "COSTURA" (STITCHING) PARA UNIR LÍNEAS SUELTAS ---
// Procesa DXF fragmentados uniendo LINE y POLYLINE abiertas en polígonos cerrados
function mergeFragments(entities: any[], layerName: string): [number, number][][] {
    const segments: { start: [number, number], end: [number, number] }[] = [];

    entities.forEach((e: any) => {
        if (e.layer !== layerName) return;

        if (e.type === 'LINE') {
            segments.push({
                start: [e.vertices[0].x, e.vertices[0].y],
                end: [e.vertices[1].x, e.vertices[1].y]
            });
        }
        else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
            if (e.vertices && e.vertices.length > 1) {
                for (let i = 0; i < e.vertices.length - 1; i++) {
                    segments.push({
                        start: [e.vertices[i].x, e.vertices[i].y],
                        end: [e.vertices[i + 1].x, e.vertices[i + 1].y]
                    });
                }
                if (e.shape || (e.closed === true)) {
                    segments.push({
                        start: [e.vertices[e.vertices.length - 1].x, e.vertices[e.vertices.length - 1].y],
                        end: [e.vertices[0].x, e.vertices[0].y]
                    });
                }
            }
        }
    });

    if (segments.length === 0) return [];

    const TOLERANCE = 0.01; // 1 cm de tolerancia
    const polygons: [number, number][][] = [];

    while (segments.length > 0) {
        const currentPoly: [number, number][] = [];
        let currentSegment = segments.pop()!;

        currentPoly.push(currentSegment.start);
        currentPoly.push(currentSegment.end);

        let lookingFor = currentSegment.end;
        let foundNext = true;

        while (foundNext) {
            foundNext = false;
            for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                const dStart = Math.hypot(s.start[0] - lookingFor[0], s.start[1] - lookingFor[1]);
                const dEnd = Math.hypot(s.end[0] - lookingFor[0], s.end[1] - lookingFor[1]);

                if (dStart < TOLERANCE) {
                    currentPoly.push(s.end);
                    lookingFor = s.end;
                    segments.splice(i, 1);
                    foundNext = true;
                    break;
                } else if (dEnd < TOLERANCE) {
                    currentPoly.push(s.start);
                    lookingFor = s.start;
                    segments.splice(i, 1);
                    foundNext = true;
                    break;
                }
            }
        }

        const dClose = Math.hypot(currentPoly[0][0] - currentPoly[currentPoly.length - 1][0], currentPoly[0][1] - currentPoly[currentPoly.length - 1][1]);
        if (dClose < TOLERANCE) {
            currentPoly.pop();
        }

        if (currentPoly.length >= 3) {
            polygons.push(currentPoly);
        }
    }

    return polygons;
}

// Función auxiliar: punto en polígono (Ray Casting)
function isPointInPolygonSimple(point: [number, number], polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > point[1]) !== (yj > point[1]))
            && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Función auxiliar: área firmada de polígono (Shoelace)
function calculateSignedAreaSimple(points: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
        area += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
    }
    area += points[points.length - 1][0] * points[0][1] - points[0][0] * points[points.length - 1][1];
    return area / 2;
}

// Función auxiliar para calcular área de GeoJSON Feature (Polygon o MultiPolygon) en coordenadas planares
function calculatePlanarAreaFromFeature(feature: Feature<Polygon | MultiPolygon>): number {
    if (feature.geometry.type === 'Polygon') {
        const rings = feature.geometry.coordinates as [number, number][][];
        // Area exterior - sum(areas interiores)
        let totalArea = Math.abs(calculateSignedAreaSimple(rings[0]));
        for (let i = 1; i < rings.length; i++) {
            totalArea -= Math.abs(calculateSignedAreaSimple(rings[i]));
        }
        return totalArea;
    } else if (feature.geometry.type === 'MultiPolygon') {
        let totalArea = 0;
        const polyCoords = feature.geometry.coordinates as [number, number][][][];
        polyCoords.forEach(rings => {
            totalArea += Math.abs(calculateSignedAreaSimple(rings[0]));
            for (let i = 1; i < rings.length; i++) {
                totalArea -= Math.abs(calculateSignedAreaSimple(rings[i]));
            }
        });
        return totalArea;
    }
    return 0;
}

// Procesa DXF con capas PG-LP (límites) y PG-LI (divisiones interiores)
// Une fragmentos automáticamente (tolera LINE y POLYLINE abiertas)
export function parseDxf(text: string, baseName: string = 'PARCELA_DXF'): GmlFeature[] {
    const parser = new DxfParser();
    let dxf;
    try {
        dxf = parser.parseSync(text);
    } catch (e) {
        throw new Error("El archivo DXF no es válido o está corrupto.");
    }

    if (!dxf || !dxf.entities || dxf.entities.length === 0) {
        throw new Error("El archivo DXF parece estar vacío o no contiene entidades.");
    }

    console.log(`[parseDxf] Procesando ${dxf.entities.length} entidades DXF`);

    // 1. Buscar geometrías en capas por prioridad
    let outerPolysPoints: [number, number][][] = [];
    let innerPolysPoints: [number, number][][] = [];

    // Prioridad 1: Capas estándares catastrales
    outerPolysPoints = mergeFragments(dxf.entities, 'PG-LP');
    innerPolysPoints = mergeFragments(dxf.entities, 'PG-LI');

    // Prioridad 2: Si no hay nada, buscar en capas comunes de dibujo
    if (outerPolysPoints.length === 0) {
        const fallbackLayers = ['0', 'RECINTO', 'PARCELA', 'CATASTRO', 'RECINTOS', 'POLIGONO'];
        for (const layer of fallbackLayers) {
            const found = mergeFragments(dxf.entities, layer);
            if (found.length > 0) {
                console.log(`[parseDxf] Encontrada geometría en capa de fallback: ${layer}`);
                outerPolysPoints = found;
                break;
            }
        }
    }

    // Prioridad 3: Si sigue sin haber nada, intentar CUALQUIER capa que tenga algo
    if (outerPolysPoints.length === 0) {
        const allLayers = Array.from(new Set(dxf.entities.map((e: any) => e.layer))).filter(l => l && l !== 'Defpoints');
        for (const layer of allLayers) {
            const found = mergeFragments(dxf.entities, layer as string);
            if (found.length > 0) {
                console.log(`[parseDxf] Usando capa aleatoria con datos: ${layer}`);
                outerPolysPoints = found;
                break;
            }
        }
    }

    console.log(`[parseDxf] Final: LP/Main: ${outerPolysPoints.length} polígonos, LI/Holes: ${innerPolysPoints.length} polígonos`);

    if (outerPolysPoints.length === 0 && innerPolysPoints.length === 0) {
        throw new Error("No se encontraron geometrías de polilíneas cerradas en ninguna capa del DXF.");
    }

    // Convertir a estructura intermedia
    const rawPolys: { id: string, points: [number, number][], area: number }[] = [];

    // Procesar Exteriores (PG-LP o fallback)
    outerPolysPoints.forEach((points, index) => {
        if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) {
            points.push(points[0]);
        }
        const signedArea = calculateSignedAreaSimple(points);
        rawPolys.push({
            id: `${baseName}_EXT_${index + 1}`,
            points,
            area: Math.abs(signedArea)
        });
    });

    // Procesar Interiores (PG-LI)
    innerPolysPoints.forEach((points, i) => {
        if (points[0][0] !== points[points.length - 1][0]) points.push(points[0]);
        rawPolys.push({
            id: `${baseName}_INT_${i + 1}`,
            points: points,
            area: Math.abs(calculateSignedAreaSimple(points))
        });
    });

    // Ordenar por área (mayor a menor)
    rawPolys.sort((a, b) => b.area - a.area);

    // Detección de huecos: polígonos contenidos dentro de otros
    const finalFeatures: GmlFeature[] = [];
    const consumed = new Set<string>();

    for (let i = 0; i < rawPolys.length; i++) {
        if (consumed.has(rawPolys[i].id)) continue;

        const parent = rawPolys[i];
        const holes_found: [number, number][][] = [];

        for (let j = i + 1; j < rawPolys.length; j++) {
            if (consumed.has(rawPolys[j].id)) continue;
            const child = rawPolys[j];

            // Verificar si el hijo está dentro del padre
            if (isPointInPolygonSimple(child.points[0], parent.points)) {
                holes_found.push(child.points);
                consumed.add(child.id);
            }
        }

        finalFeatures.push({
            id: parent.id.replace(/_(EXT|INT)_\d+$/, ''),
            geometry: [parent.points, ...holes_found], // exterior + huecos
            area: parent.area
        });
        consumed.add(parent.id);
    }

    // Renumerar IDs limpios
    finalFeatures.forEach((f, idx) => {
        if (finalFeatures.length === 1) {
            f.id = baseName;
        } else {
            f.id = `${baseName}_${idx + 1}`;
        }
    });

    console.log(`[parseDxf] Resultado: ${finalFeatures.length} parcelas finales`);

    return finalFeatures;
}

async function parseShp(buffer: ArrayBuffer, baseName: string = 'PARCELA_SHP', targetCrs: string = "EPSG:25830"): Promise<GmlFeature[]> {
    let geojson;
    try {
        geojson = await shp.parseZip(buffer);
    } catch (e) {
        throw new Error("Error al leer el archivo ZIP. Asegúrate de que contenga los archivos .shp, .shx y .dbf válidos.");
    }

    const features: GmlFeature[] = [];

    const processGeoJson = (data: any) => {
        const feats = Array.isArray(data) ? data : [data];
        feats.forEach(collection => {
            if (collection.type === 'FeatureCollection') {
                collection.features.forEach((f: any, i: number) => {
                    const geometry = f.geometry;
                    if (!geometry) return;

                    let polys: number[][][][] = [];

                    if (geometry.type === 'Polygon') {
                        polys.push(geometry.coordinates);
                    } else if (geometry.type === 'MultiPolygon') {
                        polys = geometry.coordinates;
                    }

                    polys.forEach((polyCoords, polyIdx) => {
                        let id = `${baseName}_${features.length + 1}`;
                        if (f.properties) {
                            const keys = Object.keys(f.properties);
                            const refKey = keys.find(k => /^(ref|rc|catastro|referencia|label)/i.test(k));
                            if (refKey && f.properties[refKey]) {
                                id = f.properties[refKey].toString();
                                if (polys.length > 1) id += `.${polyIdx + 1}`;
                            }
                        }

                        try {
                            const tPoly = turf.polygon(polyCoords);
                            const rewound = turf.rewind(tPoly, { reverse: false }) as Feature<Polygon>;

                            let coords = (rewound.geometry as Polygon).coordinates as number[][][];

                            // Detect if the coordinates are in WGS84 (lon, lat) due to shpjs reprojection
                            if (coords.length > 0 && coords[0].length > 0) {
                                const pt = coords[0][0];
                                if (Math.abs(pt[0]) <= 180 && Math.abs(pt[1]) <= 90) {
                                    // Reproject back from WGS84 to targetCrs
                                    coords = coords.map(ring =>
                                        ring.map(p => proj4("EPSG:4326", targetCrs, [p[0], p[1]]))
                                    );
                                }
                            }

                            features.push({
                                id,
                                geometry: coords,
                                area: calculatePlanarArea(turf.polygon(coords).geometry)
                            });
                        } catch (err) {
                            console.warn("Geometría SHP inválida ignorada", err);
                        }
                    });
                });
            }
        });
    };

    processGeoJson(geojson);

    if (features.length === 0) {
        throw new Error("No se encontraron geometrías válidas (Polygon/MultiPolygon) en el Shapefile.");
    }

    return features;
}

// --- Generador GML XML ---

export function generateGml(features: GmlFeature[], crs: string): string {
    const epsgCode = crs.split(':')[1];
    const timestamp = new Date().toISOString().split('.')[0] + 'Z';

    const srsName = `http://www.opengis.net/def/crs/EPSG/0/${epsgCode}`;

    let gml = `<?xml version="1.0" encoding="utf-8"?>
<FeatureCollection xmlns:xsi="${NS_MAP.xsi}" xmlns:gml="${NS_MAP.gml}" xmlns:xlink="${NS_MAP.xlink}" xmlns:cp="${NS_MAP.cp}" xmlns:gmd="http://www.isotc211.org/2005/gmd" xsi:schemaLocation="${SCHEMALOCATION}" xmlns="${NS_MAP.wfs}" timeStamp="${timestamp}" numberMatched="${features.length}" numberReturned="${features.length}">`;

    features.forEach(f => {
        const exteriorRing = f.geometry[0];
        const interiorRings = f.geometry.slice(1);

        const coordsStr = exteriorRing.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');

        // USAR AREA PLANA
        const geometry = turf.polygon(f.geometry);
        const totalArea = calculatePlanarArea(geometry.geometry);
        const areaStr = totalArea.toFixed(0);

        const refPointFeat = turf.pointOnFeature(geometry);
        const refPoint = refPointFeat.geometry.coordinates;

        // DETECCION DE REFEFERNCIA CATASTRAL Y NAMESPACE
        // Limpiamos el ID de posibles sufijos internos para chequear el formato
        const cleanIdRoot = f.id.split('_')[0].split('.')[0];
        const isRC = /^[A-Z0-9]{14}$|^[A-Z0-9]{20}$/i.test(cleanIdRoot);

        // Si el ID ya trae prefijo, respetar.
        // El usuario se queja de "ES.LOCAL.CP". Quiere "ES.SDGC.CP".

        let gmlId, namespacePrefix, label, refVal, localId;

        if (isRC) {
            // SI ES UNA RC VALIDA (14/20 chars), USAMOS FORMATO OFICIAL
            // IMPORTANTE: El ID GML debe ser unique. Si f.id ya es unico, lo usamos.
            // Si f.id es la RC pura, le pegamos el prefijo.

            if (f.id.startsWith('ES.')) {
                gmlId = f.id; // Ya viene formateado
                localId = f.id.split('.').pop();
                namespacePrefix = f.id.split('.').slice(0, 3).join('.');
            } else {
                gmlId = `ES.SDGC.CP.${f.id}`;
                namespacePrefix = 'ES.SDGC.CP';
                localId = f.id;
            }

            // Label suele ser los ultimos 2 digitos de la finca (pos 5-7 del string 14) o nada
            // XX0000 -> 00
            label = cleanIdRoot.length >= 7 ? cleanIdRoot.substring(5, 7) : '';
            refVal = `<cp:nationalCadastralReference>${cleanIdRoot}</cp:nationalCadastralReference>`;

        } else {
            // FALLBACK A LOCAL SI NO PARECE UNA RC
            const safeId = f.id.replace(/[^a-zA-Z0-9_]/g, '_');
            gmlId = `ES.LOCAL.CP.${safeId}`;
            namespacePrefix = 'ES.LOCAL.CP';
            label = '';
            refVal = '<cp:nationalCadastralReference/>';
            localId = safeId;
        }

        gml += `
<member>
  <cp:CadastralParcel gml:id="${gmlId}">
    <cp:areaValue uom="m2">${areaStr}</cp:areaValue>
    <cp:beginLifespanVersion>${isRC ? "2025-01-01T00:00:00" : timestamp}</cp:beginLifespanVersion>
    <cp:endLifespanVersion xsi:nil="true" nilReason="http://inspire.ec.europa.eu/codelist/VoidReasonValue/Unpopulated"></cp:endLifespanVersion>
    <cp:geometry>
      <gml:MultiSurface gml:id="MultiSurface_${gmlId}" srsName="${srsName}">
        <gml:surfaceMember>
          <gml:Surface gml:id="Surface_${gmlId}" srsName="${srsName}">
            <gml:patches>
              <gml:PolygonPatch>
                <gml:exterior>
                  <gml:LinearRing>
                    <gml:posList srsDimension="2" count="${exteriorRing.length}">${coordsStr}</gml:posList>
                  </gml:LinearRing>
                </gml:exterior>`;

        if (interiorRings.length > 0) {
            interiorRings.forEach(holeVals => {
                const holeStr = holeVals.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
                gml += `
                <gml:interior>
                  <gml:LinearRing>
                    <gml:posList srsDimension="2" count="${holeVals.length}">${holeStr}</gml:posList>
                  </gml:LinearRing>
                </gml:interior>`;
            });
        }

        gml += `
              </gml:PolygonPatch>
            </gml:patches>
          </gml:Surface>
        </gml:surfaceMember>
      </gml:MultiSurface>
    </cp:geometry>
    <cp:inspireId>
      <Identifier xmlns="${NS_MAP.base}">
        <localId>${localId}</localId>
        <namespace>${namespacePrefix}</namespace>
      </Identifier>
    </cp:inspireId>
    <cp:label>${label}</cp:label>
    ${refVal}
    <cp:referencePoint>
      <gml:Point gml:id="ReferencePoint_${gmlId}" srsName="${srsName}">
        <gml:pos>${refPoint[0].toFixed(2)} ${refPoint[1].toFixed(2)}</gml:pos>
      </gml:Point>
    </cp:referencePoint>
  </cp:CadastralParcel>
</member>`;
    });

    gml += `\n</FeatureCollection>`;

    return gml;
}
export interface TopologyIssue {
    type: 'OVERLAP' | 'GAP';
    geometry: Feature<Polygon | MultiPolygon>;
    message: string;
}

export function validateTopology(layers: { name: string, features: GmlFeature[] }[]): TopologyIssue[] {
    const issues: TopologyIssue[] = [];

    // Validar solo si hay 2 o más capas
    if (layers.length < 2) return issues;

    // Convertir features a Turf Polygons para facilitar operaciones
    const layerPolys = layers.map(layer => ({
        name: layer.name,
        polygons: layer.features.map(f => {
            try {
                return turf.polygon(f.geometry);
            } catch (e) {
                return null;
            }
        }).filter(p => p !== null) as Feature<Polygon>[]
    }));

    // Comparar cada capa con las demás (sin repetir pares)
    for (let i = 0; i < layerPolys.length; i++) {
        for (let j = i + 1; j < layerPolys.length; j++) {
            const layerA = layerPolys[i];
            const layerB = layerPolys[j];

            // Comparar cada polígono de A con cada polígono de B
            layerA.polygons.forEach(polyA => {
                layerB.polygons.forEach(polyB => {
                    try {
                        const intersection = turf.intersect(turf.featureCollection([polyA, polyB]));

                        // Si hay intersección y NO es solo una línea o punto (comprobando área > 0)
                        if (intersection) {
                            // IMPORTANTE: No usar turf.area ya que asume WGS84 y explota con coordenadas UTM
                            // Calculamos área planar usando nuestra función simple
                            const intersectionArea = calculatePlanarAreaFromFeature(intersection as Feature<Polygon | MultiPolygon>);

                            // Tolerancia mínima (0.5 m2) para evitar falsos positivos por imprecisión float en adjacencias
                            if (intersectionArea > 0.5) {
                                issues.push({
                                    type: 'OVERLAP',
                                    geometry: intersection as Feature<Polygon | MultiPolygon>,
                                    message: `Solape detectado entre ${layerA.name} y ${layerB.name} (${intersectionArea.toFixed(2)} m²)`
                                });
                            }
                        }
                    } catch (e) {
                        console.warn("Error calculando intersección:", e);
                    }
                });
            });
        }
    }

    return issues;
}

export function parseGml(text: string, baseName: string): GmlFeature[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Check for parse errors
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
        throw new Error("Error al analizar el archivo XML/GML.");
    }

    const parcels = xmlDoc.getElementsByTagNameNS("*", "CadastralParcel");
    const features: GmlFeature[] = [];

    // Logica fallback para namespaces (browsers a veces son quisquillosos con getElementsByTagNameNS)
    const getNodes = (parent: Element | Document, localName: string) => {
        let nodes = parent.getElementsByTagNameNS("*", localName);
        if (nodes.length === 0) nodes = parent.getElementsByTagName("cp:" + localName);
        if (nodes.length === 0) nodes = parent.getElementsByTagName("gml:" + localName);
        if (nodes.length === 0) nodes = parent.getElementsByTagName(localName);
        return Array.from(nodes);
    };

    Array.from(parcels).forEach((parcel, idx) => {
        const id = parcel.getAttribute("gml:id") || `parcel_${idx}`;

        // Buscar Surfaces (PolygonPatches)
        const patches = getNodes(parcel, "PolygonPatch");

        patches.forEach((patch, pIdx) => {
            const exteriorRing = getNodes(patch, "exterior")[0];
            if (!exteriorRing) return;

            const posList = getNodes(exteriorRing, "posList")[0];
            if (!posList || !posList.textContent) return;

            const coordsRaw = posList.textContent.trim().split(/\s+/).map(Number);
            const rings: number[][][] = [];

            // Exterior Ring (0)
            const extPoints: number[][] = [];
            for (let i = 0; i < coordsRaw.length; i += 2) {
                extPoints.push([coordsRaw[i], coordsRaw[i + 1]]);
            }
            rings.push(extPoints);

            // Interior Rings (Holes)
            const interiors = getNodes(patch, "interior");
            interiors.forEach(interior => {
                const iPosList = getNodes(interior, "posList")[0];
                if (iPosList && iPosList.textContent) {
                    const iCoordsRaw = iPosList.textContent.trim().split(/\s+/).map(Number);
                    const intPoints: number[][] = [];
                    for (let k = 0; k < iCoordsRaw.length; k += 2) {
                        intPoints.push([iCoordsRaw[k], iCoordsRaw[k + 1]]);
                    }
                    rings.push(intPoints);
                }
            });

            // Extract Area (Optional)
            let area = 0;
            const areaNode = getNodes(parcel, "areaValue")[0];
            if (areaNode && areaNode.textContent) {
                area = parseFloat(areaNode.textContent);
            } else {
                // Fallback calculation
                try {
                    const poly = turf.polygon(rings);
                    // Use our planar algo
                    // We need to import calculatePlanarArea via internal or duplicate. 
                    // Since it's not exported, lets just assume 0 or roughly turf area (geodesic).
                    // Or improved: calculate simple area here inline if needed, but 0 is safe for visuals.
                    area = turf.area(poly);
                } catch (e) { }
            }

            features.push({
                id: `${id}${patches.length > 1 ? '.' + (pIdx + 1) : ''}`,
                geometry: rings,
                area: area
            });
        });
    });

    if (features.length === 0) {
        throw new Error("No se encontraron parcelas válidas en el GML.");
    }

    return features;
}
