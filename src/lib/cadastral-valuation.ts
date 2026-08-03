export type AgeUsageGroup = "uso1" | "uso2" | "uso3";

type CategoryGroup = "cat12" | "cat3456" | "cat789";
type AgeBand = readonly [maxAge: number, cat12: number, cat3456: number, cat789: number];

// Norma 13 del RD 1020/1993. Cada fila contiene:
// edad máxima, categorías 1-2, categorías 3-6 y categorías 7-9.
const AGE_COEFFICIENTS: Record<AgeUsageGroup, readonly AgeBand[]> = {
    uso1: [
        [4, 1, 1, 1], [9, .93, .92, .90], [14, .87, .85, .82],
        [19, .82, .79, .74], [24, .77, .73, .67], [29, .72, .68, .61],
        [34, .68, .63, .56], [39, .64, .59, .51], [44, .61, .55, .47],
        [49, .58, .52, .43], [54, .55, .49, .40], [59, .52, .46, .37],
        [64, .49, .43, .34], [69, .47, .41, .32], [74, .45, .39, .30],
        [79, .43, .37, .28], [84, .41, .35, .26], [89, .40, .33, .25],
        [Number.POSITIVE_INFINITY, .39, .32, .24],
    ],
    uso2: [
        [4, 1, 1, 1], [9, .93, .91, .89], [14, .86, .84, .80],
        [19, .80, .77, .72], [24, .75, .70, .64], [29, .70, .65, .58],
        [34, .65, .60, .53], [39, .61, .56, .48], [44, .57, .52, .44],
        [49, .54, .48, .40], [54, .51, .45, .37], [59, .48, .42, .34],
        [64, .45, .39, .31], [69, .43, .37, .29], [74, .41, .35, .27],
        [79, .39, .33, .25], [84, .37, .31, .23], [89, .36, .29, .21],
        [Number.POSITIVE_INFINITY, .35, .28, .20],
    ],
    uso3: [
        [4, 1, 1, 1], [9, .92, .90, .88], [14, .84, .82, .78],
        [19, .78, .74, .69], [24, .72, .67, .61], [29, .67, .61, .54],
        [34, .62, .56, .49], [39, .58, .51, .44], [44, .54, .47, .39],
        [49, .50, .43, .35], [54, .47, .40, .32], [59, .44, .37, .29],
        [64, .41, .34, .26], [69, .39, .32, .24], [74, .37, .30, .22],
        [79, .35, .28, .20], [84, .33, .26, .19], [89, .31, .25, .18],
        [Number.POSITIVE_INFINITY, .30, .24, .17],
    ],
};

const USE_1_TYPES = new Set(["AAP", "AMC", "V", "VMC", "OFI"]);
const USE_3_TYPES = new Set(["IAL", "BIG", "ESC"]);

export function getUsageGroup(typeId: string): AgeUsageGroup {
    const normalized = typeId.trim().toUpperCase();
    if (USE_1_TYPES.has(normalized)) return "uso1";
    if (USE_3_TYPES.has(normalized)) return "uso3";
    return "uso2";
}

export function getValuationAge(assessmentApprovalYear: number, constructionYear: number): number {
    if (!Number.isInteger(assessmentApprovalYear) || !Number.isInteger(constructionYear)) {
        throw new Error("Los años deben ser números enteros.");
    }
    return Math.max(0, assessmentApprovalYear + 1 - constructionYear);
}

export type LandValuationMethod = "repercussion" | "unit";

export function getAgeCoefficient(
    age: number,
    usageGroup: AgeUsageGroup,
    category: number,
): number {
    const safeAge = Number.isFinite(age) ? Math.max(0, age) : 0;
    const safeCategory = Number.isInteger(category) && category >= 1 && category <= 9
        ? category
        : 5;
    const categoryGroup: CategoryGroup = safeCategory <= 2
        ? "cat12"
        : safeCategory <= 6
            ? "cat3456"
            : "cat789";
    const column = categoryGroup === "cat12" ? 1 : categoryGroup === "cat3456" ? 2 : 3;
    const band = AGE_COEFFICIENTS[usageGroup].find(([maxAge]) => safeAge <= maxAge);
    return band?.[column] ?? 1;
}

export function finiteNonNegative(value: unknown, fallback = 0): number {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function requirePositive(value: unknown, label: string): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${label} debe ser un número mayor que cero.`);
    }
    return parsed;
}

export interface UrbanValuationInput {
    soilArea: unknown;
    constructionArea: unknown;
    potentialConstructionArea?: unknown;
    landValuationMethod: LandValuationMethod;
    landValue: unknown;
    landCorrector?: unknown;
    promotionCoefficient: unknown;
    jointCorrector?: unknown;
    marketCoefficient: unknown;
    basicConstructionModule: unknown;
    constructionTypeCoefficient: unknown;
    conservationCoefficient: unknown;
    assessmentApprovalYear: unknown;
    constructionYear: unknown;
    typeId: string;
    category: unknown;
    ibiRate: unknown;
}

export function calculateUrbanValuation(input: UrbanValuationInput) {
    const soilArea = finiteNonNegative(input.soilArea);
    const constructionArea = finiteNonNegative(input.constructionArea);
    const potentialConstructionArea = finiteNonNegative(input.potentialConstructionArea);
    const landValue = requirePositive(input.landValue, "El valor del suelo");
    const landCorrector = requirePositive(input.landCorrector ?? 1, "El corrector del suelo");
    const promotionCoefficient = requirePositive(input.promotionCoefficient, "El coeficiente de gastos y beneficios");
    const jointCorrector = requirePositive(input.jointCorrector ?? 1, "El corrector conjunto");
    const marketCoefficient = requirePositive(input.marketCoefficient, "El coeficiente RM");
    const basicConstructionModule = requirePositive(input.basicConstructionModule, "El módulo MBC");
    const constructionTypeCoefficient = requirePositive(input.constructionTypeCoefficient, "El coeficiente de tipología");
    const conservationCoefficient = requirePositive(input.conservationCoefficient, "El coeficiente de conservación");
    const assessmentApprovalYear = Math.trunc(requirePositive(input.assessmentApprovalYear, "El año de aprobación de la ponencia"));
    const constructionYear = Math.trunc(finiteNonNegative(input.constructionYear, assessmentApprovalYear));
    const category = Math.trunc(finiteNonNegative(input.category, 5));
    const ibiRate = finiteNonNegative(input.ibiRate, .006);
    if (assessmentApprovalYear < 1900 || assessmentApprovalYear > new Date().getFullYear()) {
        throw new Error("El año de aprobación de la ponencia está fuera del intervalo admitido.");
    }
    const valuationAge = getValuationAge(assessmentApprovalYear, constructionYear);
    const ageCoefficient = getAgeCoefficient(
        valuationAge,
        getUsageGroup(input.typeId),
        category,
    );

    const landValuationArea = input.landValuationMethod === "repercussion"
        ? (potentialConstructionArea > 0 ? potentialConstructionArea : constructionArea)
        : soilArea;
    if (landValuationArea <= 0) {
        throw new Error(input.landValuationMethod === "repercussion"
            ? "La valoración por repercusión exige superficie construida real o potencial."
            : "La valoración por unitario exige superficie de suelo.");
    }

    const rawSoilValue = landValuationArea * landValue * landCorrector;
    const rawConstructionValue = constructionArea
        * constructionTypeCoefficient
        * ageCoefficient
        * conservationCoefficient
        * basicConstructionModule;
    const promotionFactor = constructionArea > 0 ? promotionCoefficient : 1;
    const commonFactor = jointCorrector * promotionFactor * marketCoefficient;
    const soilValue = roundMoney(rawSoilValue * commonFactor);
    const constructionValue = roundMoney(rawConstructionValue * commonFactor);
    const totalValue = roundMoney((rawSoilValue + rawConstructionValue) * commonFactor);

    return {
        landValuationArea,
        landValuationMethod: input.landValuationMethod,
        valuationAge,
        assessmentApprovalYear,
        ageCoefficient,
        soilValue,
        constructionValue,
        totalValue,
        estimatedGrossIbi: roundMoney(totalValue * ibiRate),
        ibiRate,
        assumesLiquidableBaseEqualsEstimatedValue: true,
    };
}
