import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
    calculateUrbanValuation,
    finiteNonNegative,
    getAgeCoefficient,
    getUsageGroup,
    getValuationAge,
} from "../../src/lib/cadastral-valuation";
import { dbTiposEvaluatorios } from "../../src/data/cadastral-rustic-data";
import { dbTipologiasUrbanas } from "../../src/data/cadastral-urban-data";

describe("motor de valoración catastral", () => {
    test("calcula la antigüedad hasta el 1 de enero siguiente a la aprobación", () => {
        // Andújar: aprobación 2010 y efectos 2011; una construcción de 2000
        // tiene 11 años a 1 de enero del ejercicio siguiente a la aprobación.
        assert.equal(getValuationAge(2010, 2000), 11);
        assert.equal(getValuationAge(2014, 2000), 15);
        assert.equal(getValuationAge(2010, 2015), 0);
    });

    test("reproduce completa la tabla H de la norma 13 del RD 1020/1993", () => {
        const bandAges = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89, 90];
        const expected = {
            uso1: [
                [1, 1, 1], [.93, .92, .90], [.87, .85, .82], [.82, .79, .74], [.77, .73, .67],
                [.72, .68, .61], [.68, .63, .56], [.64, .59, .51], [.61, .55, .47], [.58, .52, .43],
                [.55, .49, .40], [.52, .46, .37], [.49, .43, .34], [.47, .41, .32], [.45, .39, .30],
                [.43, .37, .28], [.41, .35, .26], [.40, .33, .25], [.39, .32, .24],
            ],
            uso2: [
                [1, 1, 1], [.93, .91, .89], [.86, .84, .80], [.80, .77, .72], [.75, .70, .64],
                [.70, .65, .58], [.65, .60, .53], [.61, .56, .48], [.57, .52, .44], [.54, .48, .40],
                [.51, .45, .37], [.48, .42, .34], [.45, .39, .31], [.43, .37, .29], [.41, .35, .27],
                [.39, .33, .25], [.37, .31, .23], [.36, .29, .21], [.35, .28, .20],
            ],
            uso3: [
                [1, 1, 1], [.92, .90, .88], [.84, .82, .78], [.78, .74, .69], [.72, .67, .61],
                [.67, .61, .54], [.62, .56, .49], [.58, .51, .44], [.54, .47, .39], [.50, .43, .35],
                [.47, .40, .32], [.44, .37, .29], [.41, .34, .26], [.39, .32, .24], [.37, .30, .22],
                [.35, .28, .20], [.33, .26, .19], [.31, .25, .18], [.30, .24, .17],
            ],
        } as const;

        for (const usage of ["uso1", "uso2", "uso3"] as const) {
            bandAges.forEach((age, row) => {
                [1, 5, 9].forEach((category, column) => {
                    assert.equal(getAgeCoefficient(age, usage, category), expected[usage][row][column]);
                });
            });
        }
    });

    test("clasifica tipologías residenciales, fabriles y restantes", () => {
        assert.equal(getUsageGroup("AAP"), "uso1");
        assert.equal(getUsageGroup("AMC"), "uso1");
        assert.equal(getUsageGroup("BIG"), "uso3");
        assert.equal(getUsageGroup("ESC"), "uso3");
        assert.equal(getUsageGroup("COM"), "uso2");
    });

    test("usa m² construidos, no parcela, cuando el suelo se valora por repercusión", () => {
        const result = calculateUrbanValuation({
            soilArea: 500,
            constructionArea: 100,
            landValuationMethod: "repercussion",
            landValue: 200,
            promotionCoefficient: 1.4,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: .9,
            conservationCoefficient: 1,
            assessmentApprovalYear: 2009,
            constructionYear: 2000,
            typeId: "AMC",
            category: 5,
            ibiRate: .007,
        });

        assert.equal(result.landValuationArea, 100);
        assert.equal(result.valuationAge, 10);
        assert.equal(result.ageCoefficient, .85);
        assert.equal(result.soilValue, 14_000);
        assert.equal(result.constructionValue, 29_452.5);
        assert.equal(result.totalValue, 43_452.5);
        assert.equal(result.estimatedGrossIbi, 304.17);
        assert.equal(result.ibiRate, .007);
    });

    test("usa m² de parcela cuando el suelo se valora por unitario", () => {
        const result = calculateUrbanValuation({
            soilArea: 500,
            constructionArea: 100,
            landValuationMethod: "unit",
            landValue: 200,
            promotionCoefficient: 1.4,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: .9,
            conservationCoefficient: 1,
            assessmentApprovalYear: 2009,
            constructionYear: 2000,
            typeId: "AMC",
            category: 5,
            ibiRate: .007,
        });
        assert.equal(result.landValuationArea, 500);
        assert.equal(result.totalValue, 99_452.5);
    });

    test("no aplica gastos y beneficios de promoción a una parcela sin construir", () => {
        const result = calculateUrbanValuation({
            soilArea: 500,
            constructionArea: 0,
            landValuationMethod: "unit",
            landValue: 200,
            promotionCoefficient: 1.4,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: .9,
            conservationCoefficient: 1,
            assessmentApprovalYear: 2009,
            constructionYear: 2000,
            typeId: "AMC",
            category: 5,
            ibiRate: .007,
        });
        assert.equal(result.totalValue, 50_000);
    });

    test("conserva coeficientes oficiales de tipologías urbanas seleccionadas", () => {
        const coefficient = (id: string, category: number) =>
            dbTipologiasUrbanas.find(type => type.id === id)?.categorias[category];
        assert.equal(coefficient("AAP", 5), .95);
        assert.equal(coefficient("AMC", 5), .90);
        assert.equal(coefficient("V", 1), 2.15);
        assert.equal(coefficient("IAL", 8), .37);
        assert.equal(coefficient("COM", 5), 1.05);
        assert.equal(coefficient("KPS", 9), .25);
    });

    test("neutraliza superficies negativas y valores no finitos", () => {
        assert.equal(finiteNonNegative(-10), 0);
        assert.equal(finiteNonNegative(Number.POSITIVE_INFINITY, 3), 3);
        assert.equal(finiteNonNegative("25.5"), 25.5);
    });

    test("rechaza módulos municipales ausentes en vez de aplicar valores ocultos", () => {
        assert.throws(() => calculateUrbanValuation({
            soilArea: 100,
            constructionArea: 100,
            landValuationMethod: "repercussion",
            landValue: 0,
            promotionCoefficient: 1.4,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: 1,
            conservationCoefficient: 1,
            assessmentApprovalYear: 2009,
            constructionYear: 2000,
            typeId: "AAP",
            category: 5,
            ibiRate: .006,
        }), /valor del suelo/);
    });

    test("conserva los tipos evaluatorios transcritos del BOE para casos sensibles", () => {
        const getCrop = (key: string) => {
            const crop = dbTiposEvaluatorios.find(({ clave }) => clave === key);
            assert.ok(crop, `No existe el cultivo ${key}`);
            return crop;
        };
        const getPts = (key: string, intensity: number) =>
            getCrop(key).intensidades.find(({ intensidad }) => intensidad === intensity)?.pts_ha;

        assert.equal(getCrop("CA").nombre, "Cantera");
        assert.equal(getCrop("VC").nombre, "Caza mayor");
        assert.equal(getPts("AM", 6), 2_600);
        assert.equal(getPts("C-", 8), 1_800);
        assert.equal(getPts("CR", 25), 1_200);
        assert.equal(getPts("O-", 30), 250);
        assert.equal(getPts("OR", 3), 9_500);
        assert.equal(getPts("RI", 18), 1_000);
    });
});
