// =====================================================
// TIPOLOGÍAS CONSTRUCTIVAS URBANAS
// Modificados según Cuadro de Valoración Urbana del Catastro
// =====================================================

export interface TipologiaConstructivaUrbana {
    id: string;          // e.g. "V"
    clase: string;       // e.g. "01215"
    nombre: string;
    // Coeficientes por categoría (1=lujo → 9=básico)
    categorias: Record<number, number>;
}

export const dbTipologiasUrbanas: TipologiaConstructivaUrbana[] = [
    {
        // 1.2 Vivienda aislada o pareada
        id: "V", nombre: "Vivienda en bloque / Aislada", clase: "01225",
        categorias: { 1: 1.40, 2: 1.25, 3: 1.15, 4: 1.05, 5: 0.95, 6: 0.85, 7: 0.75, 8: 0.65, 9: 0.55 }
    },
    {
        // 1.1 Vivienda colectiva en bloque abierto/cerrado
        id: "AAP", nombre: "Vivienda colectiva / Piso", clase: "01235",
        categorias: { 1: 1.00, 2: 0.90, 3: 0.80, 4: 0.60, 5: 0.50, 6: 0.45, 7: 0.40, 8: 0.35, 9: 0.30 }
    },
    {
        // 2.1 Industria
        id: "IAL", nombre: "Industrial / Nave", clase: "02125",
        categorias: { 1: 1.00, 2: 0.90, 3: 0.80, 4: 0.60, 5: 0.50, 6: 0.45, 7: 0.40, 8: 0.35, 9: 0.30 }
    },
    {
        // 2.2 Almacén
        id: "AAL", nombre: "Almacenamiento", clase: "02135",
        categorias: { 1: 0.85, 2: 0.70, 3: 0.60, 4: 0.45, 5: 0.35, 6: 0.30, 7: 0.25, 8: 0.25, 9: 0.20 }
    },
    {
        id: "KPS", nombre: "Deportivo / Piscina", clase: "05225",
        categorias: { 1: 0.85, 2: 0.75, 3: 0.60, 4: 0.50, 5: 0.40, 6: 0.30, 7: 0.20, 8: 0.10, 9: 0.05 }
    },
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
