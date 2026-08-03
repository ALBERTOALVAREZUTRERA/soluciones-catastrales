export interface MunicipalValuationReference {
    id: string;
    municipalityCode: number;
    name: string;
    assessmentApprovalYear: number;
    assessmentEffectiveYear: number;
    assessmentPublicationDate?: string;
    partialValuations?: readonly MunicipalPartialValuationReference[];
}

export interface MunicipalPartialValuationReference {
    assessmentApprovalYear: number;
    assessmentEffectiveYear: number;
    assessmentPublicationDate: string;
}

export interface DocumentedUrbanValuationProfile extends MunicipalValuationReference {
    mbc: number;
    mbr: number;
    mbrRustico: number;
    rm: number;
    gb: number;
    tipoUrbano: number;
    tipoRustico: number;
}

export const JAEN_MUNICIPAL_REFERENCES_VERIFIED_ON = "2026-08-02";

export const JAEN_MUNICIPAL_VALUATION_REFERENCES: readonly MunicipalValuationReference[] = [
    { id: "23001", municipalityCode: 1, name: "Albanchez de Mágina", assessmentApprovalYear: 2002, assessmentEffectiveYear: 2003 },
    { id: "23002", municipalityCode: 2, name: "Alcalá la Real", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009, assessmentPublicationDate: "2008-06-27" },
    { id: "23003", municipalityCode: 3, name: "Alcaudete", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23004", municipalityCode: 4, name: "Aldeaquemada", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23005", municipalityCode: 5, name: "Andújar", assessmentApprovalYear: 2010, assessmentEffectiveYear: 2011 },
    { id: "23006", municipalityCode: 6, name: "Arjona", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23007", municipalityCode: 7, name: "Arjonilla", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23008", municipalityCode: 8, name: "Arquillos", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23905", municipalityCode: 102, name: "Arroyo del Ojanco", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23009", municipalityCode: 9, name: "Baeza", assessmentApprovalYear: 1999, assessmentEffectiveYear: 2000 },
    { id: "23010", municipalityCode: 10, name: "Bailén", assessmentApprovalYear: 1994, assessmentEffectiveYear: 1995 },
    { id: "23011", municipalityCode: 11, name: "Baños de la Encina", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23012", municipalityCode: 12, name: "Beas de Segura", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23902", municipalityCode: 13, name: "Bedmar y Garcíez", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23014", municipalityCode: 14, name: "Begíjar", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23015", municipalityCode: 15, name: "Bélmez de la Moraleda", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23016", municipalityCode: 16, name: "Benatae", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23017", municipalityCode: 17, name: "Cabra del Santo Cristo", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23018", municipalityCode: 18, name: "Cambil", assessmentApprovalYear: 2009, assessmentEffectiveYear: 2010 },
    { id: "23019", municipalityCode: 19, name: "Campillo de Arenas", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23020", municipalityCode: 20, name: "Canena", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23021", municipalityCode: 21, name: "Carboneros", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23901", municipalityCode: 23, name: "Cárcheles", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23025", municipalityCode: 25, name: "Castellar", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23026", municipalityCode: 26, name: "Castillo de Locubín", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23027", municipalityCode: 27, name: "Cazalilla", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23028", municipalityCode: 28, name: "Cazorla", assessmentApprovalYear: 1999, assessmentEffectiveYear: 2000 },
    { id: "23029", municipalityCode: 29, name: "Chiclana de Segura", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23030", municipalityCode: 30, name: "Chilluévar", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23031", municipalityCode: 31, name: "Escañuela", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23032", municipalityCode: 32, name: "Espeluy", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23033", municipalityCode: 33, name: "Frailes", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23034", municipalityCode: 34, name: "Fuensanta de Martos", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23035", municipalityCode: 35, name: "Fuerte del Rey", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23037", municipalityCode: 37, name: "Génave", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23039", municipalityCode: 39, name: "Guarromán", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23041", municipalityCode: 41, name: "Higuera de Calatrava", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23042", municipalityCode: 42, name: "Hinojares", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23043", municipalityCode: 43, name: "Hornos", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23044", municipalityCode: 44, name: "Huelma", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23045", municipalityCode: 45, name: "Huesa", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23046", municipalityCode: 46, name: "Ibros", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23048", municipalityCode: 48, name: "Iznatoraf", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23049", municipalityCode: 49, name: "Jabalquinto", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    {
        id: "23050",
        municipalityCode: 900,
        name: "Jaén",
        assessmentApprovalYear: 1996,
        assessmentEffectiveYear: 1997,
        assessmentPublicationDate: "1996-04-24",
        partialValuations: [
            { assessmentApprovalYear: 2000, assessmentEffectiveYear: 2001, assessmentPublicationDate: "2000-11-15" },
            { assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004, assessmentPublicationDate: "2003-10-23" },
        ],
    },
    { id: "23051", municipalityCode: 51, name: "Jamilena", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23052", municipalityCode: 52, name: "Jimena", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23053", municipalityCode: 53, name: "Jódar", assessmentApprovalYear: 1999, assessmentEffectiveYear: 2000 },
    { id: "23024", municipalityCode: 24, name: "La Carolina", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23038", municipalityCode: 38, name: "La Guardia de Jaén", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23047", municipalityCode: 47, name: "La Iruela", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23072", municipalityCode: 72, name: "La Puerta de Segura", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23040", municipalityCode: 40, name: "Lahiguera", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23054", municipalityCode: 54, name: "Larva", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23055", municipalityCode: 55, name: "Linares", assessmentApprovalYear: 2001, assessmentEffectiveYear: 2002 },
    { id: "23056", municipalityCode: 56, name: "Lopera", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23099", municipalityCode: 99, name: "Los Villares", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23057", municipalityCode: 57, name: "Lupión", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23058", municipalityCode: 58, name: "Mancha Real", assessmentApprovalYear: 1999, assessmentEffectiveYear: 2000 },
    { id: "23059", municipalityCode: 59, name: "Marmolejo", assessmentApprovalYear: 1995, assessmentEffectiveYear: 1996 },
    { id: "23060", municipalityCode: 60, name: "Martos", assessmentApprovalYear: 1995, assessmentEffectiveYear: 1996 },
    { id: "23061", municipalityCode: 61, name: "Mengíbar", assessmentApprovalYear: 1998, assessmentEffectiveYear: 1999 },
    { id: "23062", municipalityCode: 62, name: "Montizón", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23063", municipalityCode: 63, name: "Navas de San Juan", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23064", municipalityCode: 64, name: "Noalejo", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23065", municipalityCode: 65, name: "Orcera", assessmentApprovalYear: 2009, assessmentEffectiveYear: 2010 },
    { id: "23066", municipalityCode: 66, name: "Peal de Becerro", assessmentApprovalYear: 2002, assessmentEffectiveYear: 2003 },
    { id: "23067", municipalityCode: 67, name: "Pegalajar", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23069", municipalityCode: 69, name: "Porcuna", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23070", municipalityCode: 70, name: "Pozo Alcón", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23071", municipalityCode: 71, name: "Puente de Génave", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23073", municipalityCode: 73, name: "Quesada", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23074", municipalityCode: 74, name: "Rus", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23075", municipalityCode: 75, name: "Sabiote", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23076", municipalityCode: 76, name: "Santa Elena", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23077", municipalityCode: 77, name: "Santiago de Calatrava", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23904", municipalityCode: 78, name: "Santiago-Pontones", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23079", municipalityCode: 79, name: "Santisteban del Puerto", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23080", municipalityCode: 80, name: "Santo Tomé", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23081", municipalityCode: 81, name: "Segura de la Sierra", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009 },
    { id: "23082", municipalityCode: 82, name: "Siles", assessmentApprovalYear: 2009, assessmentEffectiveYear: 2010 },
    { id: "23084", municipalityCode: 84, name: "Sorihuela del Guadalimar", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23085", municipalityCode: 85, name: "Torreblascopedro", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23086", municipalityCode: 86, name: "Torredelcampo", assessmentApprovalYear: 1995, assessmentEffectiveYear: 1996 },
    { id: "23087", municipalityCode: 87, name: "Torredonjimeno", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23088", municipalityCode: 88, name: "Torreperogil", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23090", municipalityCode: 90, name: "Torres", assessmentApprovalYear: 2005, assessmentEffectiveYear: 2006 },
    { id: "23091", municipalityCode: 91, name: "Torres de Albanchez", assessmentApprovalYear: 2009, assessmentEffectiveYear: 2010 },
    { id: "23092", municipalityCode: 92, name: "Úbeda", assessmentApprovalYear: 2008, assessmentEffectiveYear: 2009, assessmentPublicationDate: "2008-06-27" },
    { id: "23093", municipalityCode: 93, name: "Valdepeñas de Jaén", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23094", municipalityCode: 94, name: "Vilches", assessmentApprovalYear: 2002, assessmentEffectiveYear: 2003 },
    { id: "23095", municipalityCode: 95, name: "Villacarrillo", assessmentApprovalYear: 2007, assessmentEffectiveYear: 2008 },
    { id: "23096", municipalityCode: 96, name: "Villanueva de la Reina", assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004 },
    { id: "23097", municipalityCode: 97, name: "Villanueva del Arzobispo", assessmentApprovalYear: 2004, assessmentEffectiveYear: 2005 },
    { id: "23098", municipalityCode: 98, name: "Villardompardo", assessmentApprovalYear: 2006, assessmentEffectiveYear: 2007 },
    { id: "23101", municipalityCode: 101, name: "Villarrodrigo", assessmentApprovalYear: 1993, assessmentEffectiveYear: 1994 },
    { id: "23903", municipalityCode: 100, name: "Villatorres", assessmentApprovalYear: 2001, assessmentEffectiveYear: 2002 },
] as const;

function normalizeMunicipality(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim()
        .toLowerCase();
}

export function getJaenMunicipalValuationReference(
    municipality: string,
): MunicipalValuationReference | null {
    const normalized = normalizeMunicipality(municipality);
    return JAEN_MUNICIPAL_VALUATION_REFERENCES.find(
        ({ name }) => normalizeMunicipality(name) === normalized,
    ) ?? null;
}

export function getOfficialMunicipalReferenceUrl(
    reference: MunicipalValuationReference,
): string {
    const officialName = reference.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    return `https://www.sedecatastro.gob.es/portalcatastro/CoeficientesPonenciasDatos.aspx?desMunicipio=${encodeURIComponent(officialName)}&municipio=${reference.municipalityCode}&provincia=23`;
}

export function getOfficialMunicipalValuationMapUrl(
    reference: MunicipalValuationReference,
): string {
    return `https://ovc.catastro.meh.es/Cartografia/WMS/ponencia.aspx?del=23&mun=${reference.municipalityCode}`;
}

export function getPossibleAssessmentApprovalYears(
    reference: MunicipalValuationReference,
): readonly number[] {
    return [
        reference.assessmentApprovalYear,
        ...(reference.partialValuations ?? []).map(({ assessmentApprovalYear }) => assessmentApprovalYear),
    ];
}

export function requiresParcelSpecificAssessmentYear(
    reference: MunicipalValuationReference | null,
): boolean {
    return Boolean(reference?.partialValuations?.length);
}

export function getDocumentedUrbanProfile(
    municipality: string,
): DocumentedUrbanValuationProfile | null {
    const reference = getJaenMunicipalValuationReference(municipality);
    if (!reference) return null;

    if (reference.id === "23005") {
        return {
            ...reference,
            mbc: 550,
            mbr: 450,
            mbrRustico: 37.8,
            rm: 0.5,
            gb: 1.3,
            tipoUrbano: 0.00593,
            tipoRustico: 0.01068,
        };
    }

    if (reference.id === "23092") {
        return {
            ...reference,
            mbc: 550,
            mbr: 450,
            mbrRustico: 0,
            rm: 0.5,
            gb: 1.3,
            tipoUrbano: 0.0079,
            tipoRustico: 0.0116,
        };
    }

    if (reference.id === "23002") {
        return {
            ...reference,
            mbc: 500,
            mbr: 450,
            mbrRustico: 0,
            rm: 0.5,
            gb: 1.3,
            tipoUrbano: 0.00499,
            tipoRustico: 0.0074,
        };
    }

    return null;
}
