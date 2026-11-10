import {
  JAEN_MUNICIPAL_IBI_REFERENCES,
  type MunicipalIbiReference,
} from "@/data/cadastral-municipal-ibi";

export type IbiMunicipio = MunicipalIbiReference & {
  slug: string;
  /** Puesto por tipo urbano dentro de la provincia (1 = tipo más alto). */
  urbanRank: number;
};

export function slugifyMunicipio(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const byUrbanRate = [...JAEN_MUNICIPAL_IBI_REFERENCES].sort(
  (a, b) => b.generalUrbanRate - a.generalUrbanRate,
);

export const IBI_MUNICIPIOS: readonly IbiMunicipio[] =
  JAEN_MUNICIPAL_IBI_REFERENCES.map((reference) => ({
    ...reference,
    slug: slugifyMunicipio(reference.name),
    urbanRank:
      byUrbanRate.findIndex(
        (item) => item.generalUrbanRate === reference.generalUrbanRate,
      ) + 1,
  }));

export const IBI_PROVINCE_AVERAGE = {
  urban:
    IBI_MUNICIPIOS.reduce((sum, item) => sum + item.generalUrbanRate, 0) /
    IBI_MUNICIPIOS.length,
  rustic:
    IBI_MUNICIPIOS.reduce((sum, item) => sum + item.rusticRate, 0) /
    IBI_MUNICIPIOS.length,
};

export function getIbiMunicipio(slug: string) {
  return IBI_MUNICIPIOS.find((item) => item.slug === slug) ?? null;
}

/** Tipo de gravamen como porcentaje en formato español: 0.00593 → "0,593 %". */
export function formatRate(rate: number) {
  return `${(rate * 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} %`;
}

export function formatEuros(value: number) {
  return `${value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}
