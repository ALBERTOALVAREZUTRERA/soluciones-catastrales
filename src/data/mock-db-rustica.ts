export const dbMunicipiosRustica = [
    { id_municipio: "23005", Nombre: "Andújar", MBC: 600, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23059", Nombre: "Marmolejo", MBC: 550, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23006", Nombre: "Arjona", MBC: 570, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23097", Nombre: "Villanueva de la Reina", MBC: 550, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23050", Nombre: "Jaén", MBC: 650, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "28079", Nombre: "Madrid", MBC: 850, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23010", Nombre: "Bailén", MBC: 580, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23011", Nombre: "Baños de la Encina", MBC: 540, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23054", Nombre: "Lahiguera", MBC: 530, Tasa_Capitalizacion: 0.03 },
    { id_municipio: "23056", Nombre: "Lopera", MBC: 560, Tasa_Capitalizacion: 0.03 },
];

export const dbCultivos = [
    { id: "O-S", Nombre: "Olivar secano", Renta_Hectarea: 300 },
    { id: "O-R", Nombre: "Olivar regadío", Renta_Hectarea: 800 },
    { id: "L-S", Nombre: "Labor secano", Renta_Hectarea: 150 },
    { id: "L-R", Nombre: "Labor regadío", Renta_Hectarea: 600 },
    { id: "P", Nombre: "Pastos", Renta_Hectarea: 50 },
    { id: "M", Nombre: "Matorral", Renta_Hectarea: 10 },
    { id: "C", Nombre: "Cítricos", Renta_Hectarea: 900 },
    { id: "V", Nombre: "Viñedo", Renta_Hectarea: 450 },
];

export const dbTipologiasRusticas = [
    { id: "RUR", Nombre: "Uso residencial rural (Clase 1.3)", Coeficiente: 1.0 },
    { id: "NAV", Nombre: "Naves agrícolas (Clase 2.1)", Coeficiente: 0.5 },
    { id: "INV", Nombre: "Invernaderos (Clase 2.1)", Coeficiente: 0.4 },
    { id: "ALM", Nombre: "Almacén o Pajar", Coeficiente: 0.6 },
];

export const coeficientesAntiguedad = [
    { label: "0-5 años", maxAge: 5, coef: 1.0 },
    { label: "6-10 años", maxAge: 10, coef: 0.9 },
    { label: "11-20 años", maxAge: 20, coef: 0.8 },
    { label: "21-30 años", maxAge: 30, coef: 0.7 },
    { label: "31-40 años", maxAge: 40, coef: 0.6 },
    { label: "41-50 años", maxAge: 50, coef: 0.5 },
    { label: "Más de 50 años", maxAge: 999, coef: 0.4 },
];

export const coeficientesConservacion = [
    { label: "Normal", value: "Normal", coef: 1.0 },
    { label: "Regular", value: "Regular", coef: 0.85 },
    { label: "Deficiente", value: "Deficiente", coef: 0.5 },
    { label: "Ruinoso", value: "Ruinoso", coef: 0.0 }, // En la práctica catastral rústica, ruinoso sin uso puede ser 0
];
