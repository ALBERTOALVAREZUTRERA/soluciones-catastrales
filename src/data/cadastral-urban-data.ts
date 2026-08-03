// =====================================================
// TIPOLOGÍAS CONSTRUCTIVAS URBANAS
// Modificados según Cuadro de Valoración Urbana del Catastro
// =====================================================

// Coeficientes normativos de tipología y conservación. Los módulos MBC/MBR,
// el año de ponencia y los tipos de IBI no forman parte de este archivo porque
// deben verificarse para cada municipio y ejercicio.
export interface TipologiaConstructivaUrbana {
    id: string;          // e.g. "V"
    clase: string;       // e.g. "01215"
    nombre: string;
    // Coeficientes por categoría (1=lujo → 9=básico)
    categorias: Record<number, number>;
}

export const dbTipologiasUrbanas: TipologiaConstructivaUrbana[] = [
    {
        id: "AAP", nombre: "1.1.1 Vivienda colectiva · edificación abierta", clase: "1.1.1",
        categorias: { 1: 1.65, 2: 1.40, 3: 1.20, 4: 1.05, 5: 0.95, 6: 0.85, 7: 0.75, 8: 0.65, 9: 0.55 }
    },
    {
        id: "AMC", nombre: "1.1.2 Vivienda colectiva · manzana cerrada", clase: "1.1.2",
        categorias: { 1: 1.60, 2: 1.35, 3: 1.15, 4: 1.00, 5: 0.90, 6: 0.80, 7: 0.70, 8: 0.60, 9: 0.50 }
    },
    {
        id: "V", nombre: "1.2.1 Vivienda unifamiliar · aislada o pareada", clase: "1.2.1",
        categorias: { 1: 2.15, 2: 1.80, 3: 1.45, 4: 1.25, 5: 1.10, 6: 1.00, 7: 0.90, 8: 0.80, 9: 0.70 }
    },
    {
        id: "VMC", nombre: "1.2.2 Vivienda unifamiliar · en línea/manzana cerrada", clase: "1.2.2",
        categorias: { 1: 2.00, 2: 1.65, 3: 1.35, 4: 1.15, 5: 1.05, 6: 0.95, 7: 0.85, 8: 0.75, 9: 0.65 }
    },
    {
        id: "IAL", nombre: "2.1.1 Nave de fabricación · una planta", clase: "2.1.1",
        categorias: { 1: 1.05, 2: 0.90, 3: 0.75, 4: 0.60, 5: 0.50, 6: 0.45, 7: 0.40, 8: 0.37, 9: 0.35 }
    },
    {
        id: "AAL", nombre: "2.1.3 Nave de almacenamiento", clase: "2.1.3",
        categorias: { 1: 0.85, 2: 0.70, 3: 0.60, 4: 0.50, 5: 0.45, 6: 0.35, 7: 0.30, 8: 0.25, 9: 0.20 }
    },
    {
        id: "OFI", nombre: "3.2.1 Oficinas en edificio mixto · unido a viviendas", clase: "3.2.1",
        categorias: { 1: 2.05, 2: 1.80, 3: 1.50, 4: 1.30, 5: 1.10, 6: 1.00, 7: 0.90, 8: 0.80, 9: 0.70 }
    },
    {
        id: "COM", nombre: "4.1.1 Local comercial/taller en edificio mixto", clase: "4.1.1",
        categorias: { 1: 1.95, 2: 1.60, 3: 1.35, 4: 1.20, 5: 1.05, 6: 0.95, 7: 0.85, 8: 0.75, 9: 0.65 }
    },
    {
        id: "KPS", nombre: "5.2.2 Piscina descubierta", clase: "5.2.2",
        categorias: { 1: 0.90, 2: 0.80, 3: 0.70, 4: 0.60, 5: 0.50, 6: 0.40, 7: 0.35, 8: 0.30, 9: 0.25 }
    },
    {
        id: "GAR", nombre: "2.2.1 Garaje", clase: "2.2.1",
        categorias: { 1: 1.15, 2: 1.00, 3: 0.85, 4: 0.70, 5: 0.60, 6: 0.50, 7: 0.40, 8: 0.30, 9: 0.20 }
    },
    {
        id: "ESC", nombre: "6.1.1 Espectáculos varios · cubiertos", clase: "6.1.1",
        categorias: { 1: 1.90, 2: 1.70, 3: 1.50, 4: 1.35, 5: 1.20, 6: 1.05, 7: 0.95, 8: 0.85, 9: 0.75 }
    },
    {
        id: "HOS", nombre: "7.1.1 Hotel, hostal o motel", clase: "7.1.1",
        categorias: { 1: 2.65, 2: 2.35, 3: 2.10, 4: 1.90, 5: 1.70, 6: 1.50, 7: 1.35, 8: 1.20, 9: 1.05 }
    }
];

export const coeficientesAntiguedadUrbana = [
    { label: "0-4 años", maxAge: 4, coef: 1.00 },
    { label: "5-9 años", maxAge: 9, coef: 0.93 },
    { label: "10-14 años", maxAge: 14, coef: 0.87 },
    { label: "15-19 años", maxAge: 19, coef: 0.82 },
    { label: "20-24 años", maxAge: 24, coef: 0.77 },
    { label: "25-29 años", maxAge: 29, coef: 0.72 },
    { label: "30-34 años", maxAge: 34, coef: 0.68 },
    { label: "35-39 años", maxAge: 39, coef: 0.64 },
    { label: "40-44 años", maxAge: 44, coef: 0.61 },
    { label: "45-49 años", maxAge: 49, coef: 0.59 }, // Urbano can be 0.59 instead of 0.58
    { label: "50-54 años", maxAge: 54, coef: 0.56 },
    { label: "55-59 años", maxAge: 59, coef: 0.53 },
    { label: "60-64 años", maxAge: 64, coef: 0.50 },
    { label: "65-69 años", maxAge: 69, coef: 0.47 },
    { label: "70-74 años", maxAge: 74, coef: 0.45 },
    { label: "75-79 años", maxAge: 79, coef: 0.43 },
    { label: "80-84 años", maxAge: 84, coef: 0.41 },
    { label: "85-89 años", maxAge: 89, coef: 0.40 },
    { label: "90+ años", maxAge: 999, coef: 0.39 },
];

export const coeficientesConservacionUrbana = [
    { label: "Normal (N)", value: "N", coef: 1.00 },
    { label: "Regular (R)", value: "R", coef: 0.85 },
    { label: "Deficiente (D)", value: "D", coef: 0.50 },
    { label: "Ruinoso (U)", value: "U", coef: 0.00 },
];
