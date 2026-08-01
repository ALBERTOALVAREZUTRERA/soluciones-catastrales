export interface ReportData {
    referenciaCatastral: string;
    municipio: string;
    clase: string;
    uso: string;
    superficie: number;
    anioConstruccion: number;
    mbc: number;
    mbr: number;
    rm: number;
    gb: number;
    valorSuelo: number;
    valorConstruccion: number;
    valorTotal: number;
}

export function validateReportData(data: ReportData): void {
    const numericValues = [
        data.superficie,
        data.mbc,
        data.mbr,
        data.rm,
        data.gb,
        data.valorSuelo,
        data.valorConstruccion,
        data.valorTotal,
    ];

    if (
        numericValues.some(value => !Number.isFinite(value) || value < 0)
        || !Number.isInteger(data.anioConstruccion)
        || data.anioConstruccion < 1000
        || data.anioConstruccion > 2200
    ) {
        throw new Error("La valoración contiene valores numéricos no válidos.");
    }
}

export function safeReportFilename(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[^A-Za-z0-9_-]+/g, "_")
        .slice(0, 80) || "Catastral";
}

export function formatReportNumber(value: number): string {
    return value.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
