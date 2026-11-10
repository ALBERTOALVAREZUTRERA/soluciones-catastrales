import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { dbTipologiasRusticas } from "../../src/data/cadastral-rustic-data";
import { dbTipologiasUrbanas } from "../../src/data/cadastral-urban-data";
import {
    calculateUrbanValuation,
    getAgeCoefficient,
    getUsageGroup,
    getValuationAge,
} from "../../src/lib/cadastral-valuation";

// Importes tomados de hojas informativas oficiales de Andújar (ponencia 2010,
// MBC 550, G+B 1,30, RM 0,50) guardadas en "HOJAS VALORACION EJEMPLO".
const andujar = {
    landValuationMethod: "repercussion" as const,
    promotionCoefficient: 1.3,
    marketCoefficient: .5,
    basicConstructionModule: 550,
    assessmentApprovalYear: 2010,
    ibiRate: .00593,
};
const urban = (id: string, category: number) =>
    dbTipologiasUrbanas.find(type => type.id === id)!.categorias[category];
const rustic = (id: string, category: number) =>
    dbTipologiasRusticas.find(type => type.id === id)!.categorias[category];

describe("contraste con hojas informativas oficiales", () => {
    test("urbana: vivienda 1.2.2 cat. 5 de 1976 (158 m², R47 a 172 €/m²)", () => {
        const result = calculateUrbanValuation({
            ...andujar,
            soilArea: 298,
            constructionArea: 158,
            landValue: 172,
            constructionTypeCoefficient: urban("VMC", 5),
            conservationCoefficient: 1,
            constructionYear: 1976,
            typeId: "VMC",
            category: 5,
        });
        assert.equal(result.ageCoefficient, .59);
        assert.equal(result.soilValue, 17_664.4);
        assert.equal(result.constructionValue, 34_992.46);
    });

    test("urbana: nave 2.1.2 cat. 5 (H 0,56) y almacén 2.1.3 cat. 5 (H 0,60) de 1980", () => {
        const nave = calculateUrbanValuation({
            ...andujar, soilArea: 262, constructionArea: 228, landValue: 120,
            constructionTypeCoefficient: urban("IVP", 5), conservationCoefficient: 1,
            constructionYear: 1980, typeId: "IVP", category: 5,
        });
        assert.equal(nave.soilValue, 17_784);
        assert.equal(nave.constructionValue, 27_387.36);

        const almacen = calculateUrbanValuation({
            ...andujar, soilArea: 262, constructionArea: 198, landValue: 172,
            constructionTypeCoefficient: urban("AAL", 5), conservationCoefficient: 1,
            constructionYear: 1980, typeId: "AAL", category: 5,
        });
        assert.equal(almacen.soilValue, 22_136.4);
        assert.equal(almacen.constructionValue, 19_111.95);
    });

    test("rústica: coeficientes de tipología y antigüedad de las hojas", () => {
        const h = (id: string, year: number, category: number) =>
            getAgeCoefficient(getValuationAge(2010, year), getUsageGroup(id), category);
        assert.equal(rustic("V", 5), 1.1);
        assert.equal(h("V", 2003, 5), .92);
        assert.equal(h("V", 2001, 5), .85);
        assert.equal(rustic("BIG", 8), .25);
        assert.equal(h("BIG", 2003, 8), .89);
        assert.equal(rustic("POR", 6), .55);
        assert.equal(h("POR", 2001, 6), .85);
        // 249 m² × 550 × 1,10 × 0,85 × RM 0,50 = 64.024,13 €
        assert.equal(Math.round(249 * 550 * rustic("V", 5) * h("V", 2001, 5) * .5 * 100) / 100, 64_024.13);
    });

    test("estado ruinoso anula la construcción y el coeficiente de actualización escala el total", () => {
        const base = {
            ...andujar, soilArea: 100, constructionArea: 100, landValue: 172,
            constructionTypeCoefficient: 1, constructionYear: 2010, typeId: "V", category: 5,
        };
        const ruin = calculateUrbanValuation({ ...base, conservationCoefficient: 0 });
        assert.equal(ruin.constructionValue, 0);
        assert.equal(ruin.totalValue, ruin.soilValue);

        const plain = calculateUrbanValuation({ ...base, conservationCoefficient: 1 });
        const updated = calculateUrbanValuation({ ...base, conservationCoefficient: 1, updateCoefficient: 1.5 });
        assert.equal(updated.totalValue, Math.round(plain.totalValue * 1.5 * 100) / 100);
    });
});
