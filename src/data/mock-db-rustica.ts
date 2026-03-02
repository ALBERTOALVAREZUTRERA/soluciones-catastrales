// =====================================================
// TIPOS EVALUATORIOS OFICIALES — PROVINCIA DE JAÉN
// BOE nº 227, 22 septiembre 1998
// Acuerdo 8/1998, Consejo Territorial de la Propiedad
// Inmobiliaria de Jaén. Quinquenio 1983-1987.
// =====================================================

// Pesetas → Euros: dividir por 166,386
const PTS_TO_EUR = 166.386;

// ── COEFICIENTES DE ACTUALIZACIÓN ANUALES ──
// Fuente: Presupuestos Generales del Estado + Excel verificado del usuario
// Acumulado = producto de todos los coefs desde 1990 hasta el año actual
// Valor_actualizado = Superficie(Ha) × Tipo(€/Ha) × Coef_Acumulado
export const COEFS_ACTUALIZACION_ANUALES: { anio: number; coef: number; acumulado: number }[] = [
    { anio: 1990, coef: 17.500, acumulado: 17.500 },
    { anio: 1991, coef: 1.500, acumulado: 26.250 },
    { anio: 1992, coef: 1.050, acumulado: 27.5625 },
    { anio: 1993, coef: 1.050, acumulado: 28.940625 },
    { anio: 1994, coef: 1.035, acumulado: 29.953547 },
    { anio: 1995, coef: 1.035, acumulado: 31.001921 },
    { anio: 1996, coef: 1.035, acumulado: 32.066988 },
    { anio: 1997, coef: 1.026, acumulado: 32.92125 },
    { anio: 1998, coef: 1.021, acumulado: 33.612546 },
    { anio: 1999, coef: 1.018, acumulado: 34.217023 },
    { anio: 2000, coef: 1.020, acumulado: 34.901975 },
    { anio: 2001, coef: 1.020, acumulado: 35.600015 },
    { anio: 2002, coef: 1.020, acumulado: 36.312015 },
    { anio: 2003, coef: 1.020, acumulado: 37.038255 },
    { anio: 2004, coef: 1.020, acumulado: 37.779021 },
    { anio: 2005, coef: 1.020, acumulado: 38.534601 },
    { anio: 2006, coef: 1.020, acumulado: 39.305293 },
    { anio: 2007, coef: 1.020, acumulado: 40.091399 },
    { anio: 2008, coef: 1.020, acumulado: 40.893227 },
    { anio: 2009, coef: 1.020, acumulado: 41.711091 },
    { anio: 2010, coef: 1.010, acumulado: 42.128202 },
    { anio: 2011, coef: 1.000, acumulado: 42.128202 },
    { anio: 2012, coef: 1.000, acumulado: 42.128202 },
];

// Coef. acumulado actual (último disponible — desde 2010 sin cambios)
export const COEF_ACTUALIZACION_DEFAULT = 42.128;

// ----- TIPOS EVALUATORIOS (en pesetas/Ha) -----
// Cada cultivo tiene intensidades productivas (1ª = mejor, progresivamente menor)
// Formato: { clave, nombre, clase, intensidades: [{int, pts}] }

export interface IntensidadTipo {
    intensidad: number;
    pts_ha: number;     // tipo evaluatorio en pesetas/Ha (BOE original)
    eur_ha: number;     // tipo en €/Ha (pts / 166,386)
}

export interface CultivoTipo {
    clave: string;
    nombre: string;
    clase: string;       // "secano" | "regadío" | "ambos"
    intensidades: IntensidadTipo[];
}

function buildIntensidades(entries: [number, number][]): IntensidadTipo[] {
    return entries.map(([intensidad, pts]) => ({
        intensidad,
        pts_ha: pts,
        eur_ha: Math.round((pts / PTS_TO_EUR) * 1000000) / 1000000
    }));
}

export const dbTiposEvaluatorios: CultivoTipo[] = [
    // ───── ALMENDROS SECANO (AM) ─────
    {
        clave: "AM", nombre: "Almendros secano", clase: "secano",
        intensidades: buildIntensidades([
            [1, 3800], [2, 3300], [3, 3000], [4, 2800], [5, 2800],
            [6, 2300], [7, 2300], [8, 2000], [9, 1800], [10, 1500],
            [11, 1000], [12, 750], [13, 750], [14, 550], [15, 350], [16, 100]
        ])
    },
    // ───── ATOCHAR (AT) ─────
    {
        clave: "AT", nombre: "Atochar", clase: "secano",
        intensidades: buildIntensidades([
            [1, 114], [2, 109], [3, 104], [4, 95], [5, 91], [6, 86],
            [7, 82], [8, 77], [9, 72], [10, 68], [11, 59], [12, 54],
            [13, 50], [14, 45], [15, 39]
        ])
    },
    // ───── CAZA MAYOR (CA) ─────
    {
        clave: "CA", nombre: "Caza mayor", clase: "secano",
        intensidades: buildIntensidades([
            [0, 53700]  // Única intensidad
        ])
    },
    // ───── LABOR SECANO (C) ─────
    {
        clave: "C-", nombre: "Labor secano (Tierra arable)", clase: "secano",
        intensidades: buildIntensidades([
            [1, 2900], [2, 2750], [3, 2600], [4, 2450], [5, 2100],
            [6, 2100], [7, 1950], [8, 1650], [9, 1350], [10, 1200],
            [11, 1200], [12, 1050], [13, 1050], [14, 900], [15, 750],
            [16, 600], [17, 500], [18, 450], [19, 350], [20, 300],
            [21, 250], [22, 225], [23, 200], [24, 175], [25, 150],
            [26, 130], [27, 120], [28, 100], [29, 90], [30, 70]
        ])
    },
    // ───── LABOR REGADÍO (CR) ─────
    {
        clave: "CR", nombre: "Labor regadío", clase: "regadío",
        intensidades: buildIntensidades([
            [1, 18450], [2, 17250], [3, 16600], [4, 16000], [5, 15400],
            [6, 14800], [7, 14200], [8, 13600], [9, 12950], [10, 11750],
            [11, 11150], [12, 10550], [13, 9900], [14, 8700], [15, 8100],
            [16, 7600], [17, 7100], [18, 6050], [19, 5250], [20, 4850],
            [21, 4050], [22, 3200], [23, 2400], [24, 2000]
        ])
    },
    // ───── PASTOS (E-) ─────
    {
        clave: "E-", nombre: "Pastos", clase: "secano",
        intensidades: buildIntensidades([
            [1, 250], [2, 230], [3, 200], [4, 170], [5, 150],
            [6, 130], [7, 110], [8, 100], [9, 80], [10, 60], [11, 40]
        ])
    },
    // ───── ENCINAR (FE) ─────
    {
        clave: "FE", nombre: "Encinar", clase: "secano",
        intensidades: buildIntensidades([
            [1, 800], [2, 700], [3, 600], [4, 500], [5, 400],
            [6, 350], [7, 300], [8, 250], [9, 220], [10, 200],
            [11, 180], [12, 160], [13, 140], [14, 120], [15, 100], [16, 80]
        ])
    },
    // ───── FRUTALES REGADÍO (FR) ─────
    {
        clave: "FR", nombre: "Frutales regadío", clase: "regadío",
        intensidades: buildIntensidades([
            [1, 15000], [2, 13900], [3, 12700], [4, 12100], [5, 10900],
            [6, 9700], [7, 9200], [8, 8000], [9, 6800], [10, 6200],
            [11, 5000], [12, 3800], [13, 3300], [14, 2200], [15, 1200]
        ])
    },
    // ───── ALCORNOCAL (FS) ─────
    {
        clave: "FS", nombre: "Alcornocal", clase: "secano",
        intensidades: buildIntensidades([
            [1, 1950], [2, 1900], [3, 1700], [4, 1600], [5, 1450],
            [6, 1350], [7, 1250], [8, 1100], [9, 1000], [10, 950],
            [11, 750], [12, 650], [13, 500], [14, 400]
        ])
    },
    // ───── HUERTA REGADÍO (HR) ─────
    {
        clave: "HR", nombre: "Huerta regadío", clase: "regadío",
        intensidades: buildIntensidades([
            [1, 22050], [2, 21400], [3, 20100], [4, 18850], [5, 17550],
            [6, 16950], [7, 15650], [8, 14400], [9, 13750], [10, 13100],
            [11, 12450], [12, 11850], [13, 11200], [14, 10550], [15, 9900],
            [16, 9500], [17, 8650], [18, 8000], [19, 7350], [20, 6750],
            [21, 6100], [22, 5600], [23, 5100], [24, 4550], [25, 4050],
            [26, 3350], [27, 3050], [28, 2250], [29, 1750], [30, 1250]
        ])
    },
    // ───── PINAR MADERABLE (MM) ─────
    {
        clave: "MM", nombre: "Pinar maderable", clase: "secano",
        intensidades: buildIntensidades([
            [1, 950], [2, 850], [3, 750], [4, 650], [5, 550],
            [6, 450], [7, 400], [8, 300], [9, 250], [10, 220],
            [11, 190], [12, 150], [13, 150], [14, 130], [15, 110], [16, 90]
        ])
    },
    // ───── MATORRAL (MT) ─────
    {
        clave: "MT", nombre: "Matorral", clase: "secano",
        intensidades: buildIntensidades([
            [1, 170], [2, 150], [3, 140], [4, 100], [5, 80],
            [6, 70], [7, 50], [8, 40], [9, 30], [10, 30], [11, 20]
        ])
    },
    // ───── OLIVAR SECANO (O-) ─────
    {
        clave: "O-", nombre: "Olivar secano", clase: "secano",
        intensidades: buildIntensidades([
            [1, 8200], [2, 7900], [3, 7600], [4, 7000], [5, 6500],
            [6, 6300], [7, 5600], [8, 5600], [9, 5100], [10, 4200],
            [11, 3900], [12, 3500], [13, 3000], [14, 3000], [15, 2600],
            [16, 2300], [17, 1900], [18, 1800], [19, 1500], [20, 1350],
            [21, 1200], [22, 1050], [23, 850], [24, 600], [25, 400],
            [26, 345], [27, 295], [28, 245], [29, 200], [30, 100]
        ])
    },
    // ───── OLIVAR REGADÍO (OR) ─────
    {
        clave: "OR", nombre: "Olivar regadío", clase: "regadío",
        intensidades: buildIntensidades([
            [1, 10700], [2, 9500], [3, 4200], [4, 8400], [5, 7600],
            [6, 7000], [7, 6200], [8, 5900], [9, 4800], [10, 4200],
            [11, 3300], [12, 3200], [13, 1900], [14, 1900], [15, 1100], [16, 600]
        ])
    },
    // ───── VIÑA SECANO (V-) ─────
    {
        clave: "V-", nombre: "Viña secano", clase: "secano",
        intensidades: buildIntensidades([
            [1, 3450], [2, 3300], [3, 3000], [4, 2750], [5, 2450],
            [6, 2300], [7, 2050], [8, 1750], [9, 1500], [10, 1350],
            [11, 1050], [12, 850], [13, 600], [14, 400], [15, 100]
        ])
    },
    // ───── ÁRBOLES DE RIBERA (RI) ─────
    {
        clave: "RI", nombre: "Árboles de ribera", clase: "regadío",
        intensidades: buildIntensidades([
            [1, 5600], [2, 5100], [3, 4800], [4, 4600], [5, 4300],
            [6, 4100], [7, 3900], [8, 3400], [9, 3100], [10, 2900],
            [11, 2600], [12, 2400], [13, 2100], [14, 1900], [15, 1700],
            [16, 1600], [17, 1400], [18, 1100], [19, 800], [20, 400], [21, 400]
        ])
    },
    // ───── SALINAS CONTINENTALES (ST) ─────
    {
        clave: "ST", nombre: "Salinas continentales", clase: "secano",
        intensidades: buildIntensidades([
            [1, 76000], [2, 69500], [3, 64000], [4, 58500], [5, 53000],
            [6, 47500], [7, 42000], [8, 36500], [9, 31000], [10, 23500],
            [11, 18500]
        ])
    },
    // ───── CAZA MENOR (VC) ─────
    {
        clave: "VC", nombre: "Caza menor", clase: "secano",
        intensidades: buildIntensidades([
            [1, 345], [2, 295], [3, 245], [4, 195], [5, 165],
            [6, 135], [7, 115]
        ])
    },
    // ───── FRUTALES SECANO (FS-) ─────
    // Note: These share clave with Alcornocal in some docs; using "FRS" to differentiate
    // ───── IMPRODUCTIVO (I-) ─────
    {
        clave: "I-", nombre: "Improductivo", clase: "secano",
        intensidades: buildIntensidades([
            [0, 0]   // Siempre valor 0
        ])
    },
];

// =====================================================
// COEFICIENTES DE USO — SUELO OCUPADO POR CONSTRUCCIÓN
// (verificados con Hojas Informativas reales de Andújar)
// =====================================================

export interface CoefUsoSueloOcupado {
    id: string;
    nombre: string;
    coeficiente: number;
    mbr_tipo: "urbano" | "rustico";  // qué MBR usar (450 ó 37.80 en Andújar)
}

export const dbCoefUsoSueloOcupado: CoefUsoSueloOcupado[] = [
    { id: "residencial", nombre: "Residencial (categorías 3-9)", coeficiente: 0.070, mbr_tipo: "urbano" },
    { id: "agricola", nombre: "Agrícola, ganadero, forestal", coeficiente: 0.100, mbr_tipo: "rustico" },
    { id: "industrial", nombre: "Industrial / Almacenaje", coeficiente: 0.060, mbr_tipo: "urbano" },
];

// =====================================================
// TIPOLOGÍAS CONSTRUCTIVAS RÚSTICAS
// (verificadas con Hojas Informativas reales de Andújar)
// Coef. tipología × MBC × Sup × Coef_H × Coef_I × RM
// =====================================================

export interface TipologiaConstructiva {
    id: string;
    nombre: string;
    clase: string;       // código de clase (ej. "01215")
    coeficiente: number; // coef. de tipología
}

export const dbTipologiasRusticas: TipologiaConstructiva[] = [
    { id: "V", nombre: "Vivienda rural", clase: "01215", coeficiente: 1.10 },
    { id: "AAL", nombre: "Almacén agrícola / logístico", clase: "01236", coeficiente: 0.55 },
    { id: "BIG", nombre: "Nave / cobertizo / granero", clase: "02138", coeficiente: 0.25 },
    { id: "KPS", nombre: "Piscina / instalación deportiva", clase: "05224", coeficiente: 0.60 },
    { id: "GAR", nombre: "Garaje / aparcamiento", clase: "03115", coeficiente: 0.50 },
    { id: "COR", nombre: "Corral / establo ganadero", clase: "02215", coeficiente: 0.30 },
    { id: "INV", nombre: "Invernadero", clase: "02310", coeficiente: 0.40 },
];

// =====================================================
// MUNICIPIOS CON DATOS RÚSTICOS
// MBR rústico = 37,80 (poblados), MBR urbano = 450, MBC = 550
// =====================================================

export const dbMunicipiosRustica = [
    { id_municipio: "23005", Nombre: "Andújar", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23059", Nombre: "Marmolejo", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23006", Nombre: "Arjona", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23097", Nombre: "Villanueva de la Reina", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23050", Nombre: "Jaén", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23010", Nombre: "Bailén", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23011", Nombre: "Baños de la Encina", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23054", Nombre: "Lahiguera", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
    { id_municipio: "23056", Nombre: "Lopera", MBC: 550, MBR_urbano: 450, MBR_rustico: 37.80, RM: 0.50, Tipo_IBI: 0.50 },
];

// =====================================================
// COEFICIENTES DE ANTIGÜEDAD (Coef. H) — Simplificados
// Para rústica se usa la tabla abreviada
// =====================================================

export const coeficientesAntiguedad = [
    { label: "0-4 años", maxAge: 4, coef: 1.00 },
    { label: "5-9 años", maxAge: 9, coef: 0.93 },
    { label: "10-14 años", maxAge: 14, coef: 0.87 },
    { label: "15-19 años", maxAge: 19, coef: 0.82 },
    { label: "20-24 años", maxAge: 24, coef: 0.77 },
    { label: "25-29 años", maxAge: 29, coef: 0.72 },
    { label: "30-34 años", maxAge: 34, coef: 0.68 },
    { label: "35-39 años", maxAge: 39, coef: 0.64 },
    { label: "40-44 años", maxAge: 44, coef: 0.61 },
    { label: "45-49 años", maxAge: 49, coef: 0.58 },
    { label: "50-54 años", maxAge: 54, coef: 0.55 },
    { label: "55-59 años", maxAge: 59, coef: 0.52 },
    { label: "60-64 años", maxAge: 64, coef: 0.50 },
    { label: "65-69 años", maxAge: 69, coef: 0.47 },
    { label: "70-74 años", maxAge: 74, coef: 0.45 },
    { label: "75-79 años", maxAge: 79, coef: 0.43 },
    { label: "80-84 años", maxAge: 84, coef: 0.41 },
    { label: "85-89 años", maxAge: 89, coef: 0.40 },
    { label: "90+ años", maxAge: 999, coef: 0.39 },
];

// =====================================================
// COEFICIENTES DE CONSERVACIÓN (Coef. I)
// =====================================================

export const coeficientesConservacion = [
    { label: "Normal (N)", value: "N", coef: 1.00 },
    { label: "Regular (R)", value: "R", coef: 0.85 },
    { label: "Deficiente (D)", value: "D", coef: 0.50 },
    { label: "Ruinoso (U)", value: "U", coef: 0.00 },
];

// =====================================================
// LEGACY EXPORTS (para compatibilidad)
// =====================================================

export const dbCultivos = dbTiposEvaluatorios.map(t => ({
    id: t.clave,
    Nombre: t.nombre,
    Renta_Hectarea: t.intensidades[0]?.eur_ha ?? 0  // fallback: intensidad 1
}));
