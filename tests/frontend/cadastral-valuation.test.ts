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

describe("motor de valoración catastral", () => {
    test("calcula la antigüedad hasta el año siguiente al de referencia", () => {
        assert.equal(getValuationAge(2010, 1976), 35);
        assert.equal(getValuationAge(2010, 2015), 0);
    });

    test("aplica la tabla H por uso y categoría del RD 1020/1993", () => {
        assert.equal(getAgeCoefficient(35, "uso1", 5), .59);
        assert.equal(getAgeCoefficient(31, "uso3", 5), .56);
        assert.equal(getAgeCoefficient(91, "uso3", 9), .17);
    });

    test("clasifica tipologías residenciales, fabriles y restantes", () => {
        assert.equal(getUsageGroup("AAP"), "uso1");
        assert.equal(getUsageGroup("BIG"), "uso3");
        assert.equal(getUsageGroup("COM"), "uso2");
    });

    test("calcula suelo, construcción, total e IBI sin ignorar el tipo configurado", () => {
        const result = calculateUrbanValuation({
            soilArea: 100,
            constructionArea: 100,
            repercussionValue: 200,
            expensesCoefficient: 1.3,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: .5,
            conservationCoefficient: 1,
            referenceYear: 2010,
            constructionYear: 2000,
            typeId: "AAP",
            category: 5,
            ibiRate: .007,
        });

        assert.equal(result.valuationAge, 11);
        assert.equal(result.ageCoefficient, .86);
        assert.equal(result.soilValue, 13_000);
        assert.equal(result.constructionValue, 15_372.5);
        assert.equal(result.totalValue, 28_372.5);
        assert.equal(result.annualIbi, 198.61);
        assert.equal(result.ibiRate, .007);
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
            repercussionValue: 0,
            expensesCoefficient: 1.3,
            marketCoefficient: .5,
            basicConstructionModule: 550,
            constructionTypeCoefficient: 1,
            conservationCoefficient: 1,
            referenceYear: 2010,
            constructionYear: 2000,
            typeId: "AAP",
            category: 5,
            ibiRate: .006,
        }), /repercusión/);
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
