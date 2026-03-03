// Urban Calculator Analysis Script (Test 3)
// ------------------------------------------

// DOCUMENT 1: 7213036 VH0171S 0001 QY (Andujar)
// VRB (Valor Repercusion Base) = 172.00
// MBR (Modulo Basico Repercusion) = 450.00
// MBC (Modulo Basico Construccion) = 550.00
// RM = 0.50

// VALORACION DE SUELO:
// Local 1: 158m2 | Coef G: 1.30 (Gastos y Bfo) | RM: 0.50 | VR (Valor Repercusion) = 172.00
// Formula in DOC: Superficie * VR * CoefG * RM
// Math: 158 * 172.00 * 1.30 * 0.50 = 17.664,40
// PERFECT MATCH.

// VALORACION DE CONSTRUCCION:
// Local 1: 158m2 | Tipologia: 01225 | Coef U: 1.0500 | Coef H: 0.59 | Coef I: 1.00
// Coef G: 1.30 | RM: 0.50 | MBC: 550.00
// Formula in DOC: Superficie * MBC * Coef_U * Coef_H * Coef_I * Coef_G * RM
// Math: 158 * 550 * 1.0500 * 0.59 * 1.00 * 1.30 * 0.50 = 34.992,465 (Rounds to ,46 or ,47 in doc it's ,46)
// PERFECT MATCH.


// DOCUMENT 3: 9959201 UG4995N 0001 UL (Cordoba)
// MBR (Suelo) = 181.505656
// MBC (Construccion) = 259.637229
// RM = 0.50 (Only RM shows, no G)

// SUELO: 
// 5300m2 * Valor unitario 12,02 * RM 0.50 = 31.853,64
// 5300 * 12.02 * 0.50 = 31853.

// CONSTRUCCION:
// Local 01/00/01: 130m2 | VIVIENDA | Valor Unit: 285.600952 | Antiguedad: A | Coef_Totales: 1.15 | Cons: 1.0 | RM: 0.50
// Math: 130 * 285.600952 * 1.15 * 1.00 * 0.50 = 21.348 ... wait, the doc doesn't show the line total.
// Wait, 136.510,82 * 2 (because of RM?) 
// Wait, Total Construcción = 136.510,82
// Total Construcción Actualizado (2020) = 269.570,60
// Coef Actualizacion Construcciones = 269570.60 / 136510.82 = 1.9747 !

console.log("Urban Analysis complete");
