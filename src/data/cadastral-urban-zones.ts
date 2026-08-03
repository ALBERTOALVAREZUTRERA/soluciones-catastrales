export type UrbanLandValuationMethod = "repercussion" | "unit";

export type UrbanRepercussionUse =
    | "housing"
    | "commercial"
    | "offices"
    | "industrial"
    | "tourism"
    | "garages"
    | "green"
    | "equipment";

export interface UrbanRepercussionZone {
    code: string;
    method: "repercussion";
    values: Record<UrbanRepercussionUse, number | null>;
}

export interface UrbanUnitZone {
    code: string;
    method: "unit";
    value: number;
}

export type UrbanValuationZone = UrbanRepercussionZone | UrbanUnitZone;

export interface MunicipalUrbanZoneRegistry {
    municipalityId: string;
    municipalityName: string;
    assessmentApprovalYear: number;
    sourceUrl: string;
    zones: readonly UrbanValuationZone[];
}

export interface OfficialZoneSelection {
    zoneCode: string;
    method: UrbanLandValuationMethod;
    landValue: number | null;
}

const UBEDA_SOURCE_URL =
    "https://ovc.catastro.meh.es/Cartografia/WMS/ponencia.aspx?del=23&mun=92";
const ALCALA_SOURCE_URL =
    "https://ovc.catastro.meh.es/Cartografia/WMS/ponencia.aspx?del=23&mun=2";
const ANDUJAR_SOURCE_URL =
    "https://ovc.catastro.meh.es/Cartografia/WMS/ponencia.aspx?del=23&mun=5";

function repercussion(
    code: string,
    housing: number,
    commercial: number,
    offices: number,
    industrial: number,
    tourism: number,
    garages: number,
    green: number,
    equipment: number,
): UrbanRepercussionZone {
    return {
        code,
        method: "repercussion",
        values: { housing, commercial, offices, industrial, tourism, garages, green, equipment },
    };
}

function unit(code: string, value: number): UrbanUnitZone {
    return { code, method: "unit", value };
}

export const MUNICIPAL_URBAN_ZONE_REGISTRIES: readonly MunicipalUrbanZoneRegistry[] = [
    {
        municipalityId: "23005",
        municipalityName: "Andújar",
        assessmentApprovalYear: 2010,
        sourceUrl: ANDUJAR_SOURCE_URL,
        zones: [
            repercussion("PR43", 262, 262, 262, 183, 262, 39.3, 26.2, 196.5),
            repercussion("R37", 423, 423, 423, 296, 423, 63.45, 42.3, 317.25),
            repercussion("R37C", 423, 575, 423, 296, 423, 63.45, 42.3, 317.25),
            repercussion("R40", 342, 342, 342, 239, 239, 51.3, 34.2, 256.5),
            repercussion("R43", 262, 262, 262, 183, 183, 39.3, 26.2, 196.5),
            repercussion("R47", 172, 172, 172, 120, 172, 36, 17.2, 129),
            repercussion("R50", 118, 118, 118, 83, 118, 36, 11.8, 88.5),
            repercussion("R55", 60, 60, 60, 42, 60, 36, 6, 45),
            repercussion("R58", 37.8, 37.8, 37.8, 37.8, 37.8, 36, 3.78, 28.35),
            unit("PU43", 85),
            unit("PU46", 47),
            unit("U37", 177),
            unit("U40", 132),
            unit("U43", 85),
            unit("U46", 47),
            unit("U49", 26),
        ],
    },
    {
        municipalityId: "23092",
        municipalityName: "Úbeda",
        assessmentApprovalYear: 2008,
        sourceUrl: UBEDA_SOURCE_URL,
        zones: [
            repercussion("PR35", 600, 600, 600, 600, 600, 90, 60, 450),
            repercussion("PR43", 305, 305, 305, 305, 305, 45.75, 30.5, 228.75),
            repercussion("R29C", 925, 1200, 925, 305, 925, 138.75, 92.5, 693.75),
            repercussion("R30", 860, 860, 860, 305, 860, 129, 86, 645),
            repercussion("R30C", 860, 1000, 860, 305, 860, 129, 86, 645),
            repercussion("R34C", 650, 1000, 650, 305, 650, 97.5, 65, 487.5),
            repercussion("R35", 600, 600, 600, 305, 600, 90, 60, 450),
            repercussion("R38", 450, 450, 450, 450, 450, 67.5, 45, 337.5),
            repercussion("R41", 362, 362, 362, 305, 362, 54.3, 36.2, 271.5),
            repercussion("R43", 305, 305, 305, 305, 305, 45.75, 30.5, 228.75),
            repercussion("R47", 210, 210, 210, 116, 210, 36, 21, 157.5),
            repercussion("R51", 134, 134, 134, 116, 134, 36, 13.4, 100.5),
            repercussion("R52", 116, 116, 116, 116, 116, 36, 11.6, 87),
            repercussion("R57", 50, 50, 50, 50, 50, 36, 5, 37.5),
            unit("PU33", 305),
            unit("U33", 305),
            unit("U42", 116),
            unit("U45", 70),
            unit("U48", 40),
        ],
    },
    {
        municipalityId: "23002",
        municipalityName: "Alcalá la Real",
        assessmentApprovalYear: 2008,
        sourceUrl: ALCALA_SOURCE_URL,
        zones: [
            repercussion("PR41", 362, 362, 362, 116, 362, 54.3, 36.2, 271.5),
            repercussion("PR47", 210, 210, 210, 116, 210, 36, 21, 157.5),
            repercussion("R34C", 650, 900, 650, 210, 650, 97.5, 65, 487.5),
            repercussion("R37C", 500, 675, 500, 210, 500, 75, 50, 375),
            repercussion("R39", 420, 420, 420, 210, 420, 63, 42, 315),
            repercussion("R41", 362, 362, 362, 362, 362, 54.3, 36.2, 271.5),
            repercussion("R42", 333, 333, 333, 210, 333, 49.95, 33.3, 249.75),
            repercussion("R47", 210, 210, 210, 210, 210, 36, 21, 157.5),
            repercussion("R51", 134, 134, 134, 116, 134, 36, 13.4, 100.5),
            repercussion("R56", 60, 60, 60, 60, 60, 36, 6, 45),
            repercussion("R58", 37.8, 37.8, 37.8, 37.8, 37.8, 36, 3.78, 28.35),
            unit("U35", 251),
            unit("U42", 116),
            unit("U44", 84),
            unit("U46", 58),
            unit("U49", 32),
        ],
    },
] as const;

function normalizeMunicipality(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim()
        .toLowerCase();
}

export function getMunicipalUrbanZoneRegistry(
    municipality: string,
): MunicipalUrbanZoneRegistry | null {
    const normalized = normalizeMunicipality(municipality);
    return MUNICIPAL_URBAN_ZONE_REGISTRIES.find(
        ({ municipalityName }) => normalizeMunicipality(municipalityName) === normalized,
    ) ?? null;
}

export function getRepercussionUse(typeId: string): UrbanRepercussionUse | null {
    if (["AAP", "AMC", "V", "VMC"].includes(typeId)) return "housing";
    if (["IAL", "AAL"].includes(typeId)) return "industrial";
    if (typeId === "OFI") return "offices";
    if (typeId === "COM") return "commercial";
    if (typeId === "GAR") return "garages";
    if (typeId === "HOS") return "tourism";
    return null;
}

export function getOfficialZoneLandValue(
    zone: UrbanValuationZone,
    typeId: string,
): number | null {
    if (zone.method === "unit") return zone.value;
    const use = getRepercussionUse(typeId);
    return use ? zone.values[use] : null;
}

export function getUrbanTypeIdFromCadastralUse(cadastralUse: string): string {
    const use = cadastralUse
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    if (/industrial|almacen|nave/.test(use)) return "IAL";
    if (/oficina/.test(use)) return "OFI";
    if (/comerc|local|taller/.test(use)) return "COM";
    if (/garaje|aparcamiento/.test(use)) return "GAR";
    if (/hotel|hostal|turist/.test(use)) return "HOS";
    return "AAP";
}

export function resolveOfficialZoneSelection(
    municipality: string,
    detectedZoneCode: string | null | undefined,
    typeId: string,
): OfficialZoneSelection | null {
    const registry = getMunicipalUrbanZoneRegistry(municipality);
    const normalizedCode = detectedZoneCode?.trim().toUpperCase();
    if (!registry || !normalizedCode) return null;
    const zone = registry.zones.find(({ code }) => code === normalizedCode);
    if (!zone) return null;
    return {
        zoneCode: zone.code,
        method: zone.method,
        landValue: getOfficialZoneLandValue(zone, typeId),
    };
}
