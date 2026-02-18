/**
 * NUEVO PARSER DXF CON ALGORITMO DE STITCHING
 * Procesa DXF fragmentados (LINE + POLYLINE abiertas) y los une en polígonos cerrados
 * Versión temporal para integración - reemplazar parseDxf en gml-utils.ts
 */

import DxfParser from 'dxf-parser';

// Función de "costura" (stitching) para unir líneas sueltas
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

    const TOLERANCE = 0.01; // 1 cm
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

// Auxiliar: punto en polígono
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
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

// Auxiliar: área firmada
function calculateSignedArea(points: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
        area += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
    }
    return area / 2;
}

/**
 * Procesa DXF con capas PG-LP (límites) y PG-LI (divisiones interiores)
 * Une fragmentos automáticamente
 */
export function parseDxfNew(text: string, baseName: string = 'PARCELA_DXF'): any[] {
    const parser = new DxfParser();
    const dxf = parser.parseSync(text);

    if (!dxf || !dxf.entities) return [];

    console.log(`[parseDxf] Procesando ${dxf.entities.length} entidades DXF`);

    // 1. Buscar geometrías en capa PG-LP (Exterior) usando el nuevo "Unificador"
    const outerPolysPoints = mergeFragments(dxf.entities, 'PG-LP');

    // 2. Buscar geometrías en capa PG-LI (Interior/Divisiones)
    const innerPolysPoints = mergeFragments(dxf.entities, 'PG-LI');

    console.log(`[parseDxf] PG-LP: ${outerPolysPoints.length} polígonos, PG-LI: ${innerPolysPoints.length} polígonos`);

    // Convertir los puntos crudos a la estructura intermedia
    const rawPolys: { id: string, points: [number, number][], area: number }[] = [];

    // Procesar Exteriores (PG-LP)
    outerPolysPoints.forEach((points, index) => {
        // Asegurar cierre
        if (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1]) {
            points.push(points[0]);
        }
        const signedArea = calculateSignedArea(points);
        rawPolys.push({
            id: `${baseName}_LP_${index + 1}`,
            points,
            area: Math.abs(signedArea)
        });
    });

    // Procesar Interiores (PG-LI)
    innerPolysPoints.forEach((points, i) => {
        if (points[0][0] !== points[points.length - 1][0]) points.push(points[0]);
        rawPolys.push({
            id: `${baseName}_LI_${i + 1}`,
            points: points,
            area: Math.abs(calculateSignedArea(points))
        });
    });

    // Ordenar por área (mayor a menor)
    rawPolys.sort((a, b) => b.area - a.area);

    // Detección de huecos: polígonos contenidos dentro de otros
    const finalFeatures: any[] = [];
    const consumed = new Set<string>();

    for (let i = 0; i < rawPolys.length; i++) {
        if (consumed.has(rawPolys[i].id)) continue;

        const parent = rawPolys[i];
        const holes_found: [number, number][][] = [];

        for (let j = i + 1; j < rawPolys.length; j++) {
            if (consumed.has(rawPolys[j].id)) continue;
            const child = rawPolys[j];

            // Verificar si el hijo está dentro del padre
            if (isPointInPolygon(child.points[0], parent.points)) {
                holes_found.push(child.points);
                consumed.add(child.id);
            }
        }

        finalFeatures.push({
            id: parent.id.replace(/_LP_\d+$/, '').replace(/_LI_\d+$/, ''),
            geometry: [parent.points, ...holes_found], // exterior + huecos
            area: parent.area
        });
        consumed.add(parent.id);
    }

    // Renumerar IDs limpios
    finalFeatures.forEach((f, idx) => {
        f.id = `${baseName}_${idx + 1}`;
    });

    console.log(`[parseDxf] Resultado: ${finalFeatures.length} parcelas finales`);

    return finalFeatures;
}
