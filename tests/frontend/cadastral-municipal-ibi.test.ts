import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
    getJaenMunicipalIbiReference,
    getOfficialJaenIbiSourceUrl,
    JAEN_MUNICIPAL_IBI_REFERENCES,
    JAEN_MUNICIPAL_IBI_TAX_YEAR,
} from "../../src/data/cadastral-municipal-ibi";
import {
    getDocumentedUrbanProfile,
    JAEN_MUNICIPAL_VALUATION_REFERENCES,
} from "../../src/data/cadastral-municipal-profiles";

describe("tipos municipales de IBI de Jaén", () => {
    test("incluye los 97 municipios para el ejercicio 2026 sin duplicados", () => {
        assert.equal(JAEN_MUNICIPAL_IBI_TAX_YEAR, 2026);
        assert.equal(JAEN_MUNICIPAL_IBI_REFERENCES.length, 97);
        assert.equal(new Set(JAEN_MUNICIPAL_IBI_REFERENCES.map(({ id }) => id)).size, 97);
    });

    test("coincide el año de última valoración con los efectos de la ponencia", () => {
        for (const valuation of JAEN_MUNICIPAL_VALUATION_REFERENCES) {
            const ibi = getJaenMunicipalIbiReference(valuation.id);
            assert.ok(ibi, valuation.name);
            assert.equal(ibi.lastValuationYear, valuation.assessmentEffectiveYear, valuation.name);
        }
    });

    test("mantiene los tipos generales oficiales de municipios sensibles", () => {
        const expected = {
            "23002": [0.00499, 0.0074],
            "23005": [0.00593, 0.01068],
            "23009": [0.0062, 0.0096],
            "23010": [0.006074, 0.0111],
            "23050": [0.0065, 0.006],
            "23055": [0.00744, 0.009],
            "23060": [0.00545, 0.01],
            "23092": [0.0079, 0.0116],
        } as const;

        for (const [id, [urban, rustic]] of Object.entries(expected)) {
            const reference = getJaenMunicipalIbiReference(id);
            assert.equal(reference?.generalUrbanRate, urban, `${id} urbano`);
            assert.equal(reference?.rusticRate, rustic, `${id} rústico`);
        }
    });

    test("todos los tipos están expresados como decimales válidos", () => {
        for (const reference of JAEN_MUNICIPAL_IBI_REFERENCES) {
            assert.ok(reference.generalUrbanRate >= 0.004 && reference.generalUrbanRate <= 0.013, reference.name);
            assert.ok(reference.rusticRate >= 0.003 && reference.rusticRate <= 0.013, reference.name);
        }
    });

    test("el perfil completo de Andújar coincide con la tabla IBI 2026", () => {
        const profile = getDocumentedUrbanProfile("Andújar");
        const ibi = getJaenMunicipalIbiReference("23005");
        assert.equal(profile?.tipoUrbano, ibi?.generalUrbanRate);
        assert.equal(profile?.tipoRustico, ibi?.rusticRate);
        assert.match(getOfficialJaenIbiSourceUrl(), /est2026\/ordenanzasfiscales/);
        assert.match(getOfficialJaenIbiSourceUrl(), /file=04123\.px/);
    });
});
