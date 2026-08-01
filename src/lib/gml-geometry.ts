import type { Geometry, MultiPolygon, Polygon } from "geojson";

export const ALLOWED_CADASTRAL_EPSG = ["25829", "25830", "25831", "32628"] as const;

export function ringArea(coords: number[][]): number {
    let area = 0;
    for (let index = 0; index < coords.length; index++) {
        const current = coords[index];
        const next = coords[(index + 1) % coords.length];
        area += (current[0] * next[1]) - (next[0] * current[1]);
    }
    return area / 2;
}

export function calculatePlanarArea(geometry: Geometry): number {
    let area = 0;
    if (geometry.type === "Polygon") {
        const polygon = geometry as Polygon;
        area += Math.abs(ringArea(polygon.coordinates[0]));
        for (let index = 1; index < polygon.coordinates.length; index++) {
            area -= Math.abs(ringArea(polygon.coordinates[index]));
        }
    } else if (geometry.type === "MultiPolygon") {
        const multiPolygon = geometry as MultiPolygon;
        for (const polygon of multiPolygon.coordinates) {
            area += Math.abs(ringArea(polygon[0]));
            for (let index = 1; index < polygon.length; index++) {
                area -= Math.abs(ringArea(polygon[index]));
            }
        }
    }
    return area;
}

export function normalizeCadastralCrs(crs: string): string {
    const epsg = String(crs).trim().toUpperCase().replace(/^EPSG:/, "");
    if (!ALLOWED_CADASTRAL_EPSG.includes(epsg as typeof ALLOWED_CADASTRAL_EPSG[number])) {
        throw new Error("El sistema de coordenadas no está admitido para este GML catastral.");
    }
    return epsg;
}

export function normalizeCadastralRing(
    input: number[][],
    clockwise = false,
): number[][] {
    const cleaned: number[][] = [];
    for (const coordinate of input) {
        if (
            !Array.isArray(coordinate)
            || coordinate.length < 2
            || !Number.isFinite(coordinate[0])
            || !Number.isFinite(coordinate[1])
        ) {
            throw new Error("La geometría contiene una coordenada no válida.");
        }
        const point = [
            Math.round(coordinate[0] * 100) / 100,
            Math.round(coordinate[1] * 100) / 100,
        ];
        const previous = cleaned.at(-1);
        if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
            cleaned.push(point);
        }
    }

    if (
        cleaned.length > 1
        && cleaned[0][0] === cleaned.at(-1)?.[0]
        && cleaned[0][1] === cleaned.at(-1)?.[1]
    ) {
        cleaned.pop();
    }
    if (cleaned.length < 3) {
        throw new Error("Cada anillo debe contener al menos tres vértices distintos.");
    }

    const signedArea = ringArea(cleaned);
    if (Math.abs(signedArea) < 0.005) {
        throw new Error("La geometría tiene superficie nula.");
    }
    const isClockwise = signedArea < 0;
    if (isClockwise !== clockwise) cleaned.reverse();
    cleaned.push([...cleaned[0]]);
    return cleaned;
}

function pointInRing(point: number[], ring: number[][]): boolean {
    let inside = false;
    for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
        const [currentX, currentY] = ring[current];
        const [previousX, previousY] = ring[previous];
        const intersects = ((currentY > point[1]) !== (previousY > point[1]))
            && point[0] < ((previousX - currentX) * (point[1] - currentY))
                / (previousY - currentY) + currentX;
        if (intersects) inside = !inside;
    }
    return inside;
}

export function normalizeCadastralGeometry(geometry: number[][][]): number[][][] {
    if (!Array.isArray(geometry) || geometry.length === 0) {
        throw new Error("La parcela no contiene un anillo exterior.");
    }
    const exterior = normalizeCadastralRing(geometry[0], false);
    const holes = geometry.slice(1).map(hole => normalizeCadastralRing(hole, true));
    for (const hole of holes) {
        if (!pointInRing(hole[0], exterior)) {
            throw new Error("Se ha encontrado un hueco fuera del anillo exterior.");
        }
    }
    return [exterior, ...holes];
}
