export const CATASTRO_WMS_URL =
    "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx";
export const CATASTRO_WMS_LAYER = "Catastro";

export const PONENCIAS_WMS_URL =
    "https://ovc.catastro.meh.es/Cartografia/WMS/ponenciasWMS.aspx";
export const PONENCIAS_WMS_LAYERS = "ZONA VALOR,TEXTO ZONA VALOR";

export const PNOA_WMS_URL = "https://www.ign.es/wms-inspire/pnoa-ma";
export const PNOA_WMS_LAYER = "OI.OrthoimageCoverage";

export const HISTORIC_CADASTRE_START_YEAR = 2005;

export function historicCadastreDate(year: number): string {
    const currentYear = new Date().getFullYear();
    const safeYear = Math.min(
        currentYear,
        Math.max(HISTORIC_CADASTRE_START_YEAR, Math.trunc(year)),
    );
    return `${safeYear}-01-01`;
}
