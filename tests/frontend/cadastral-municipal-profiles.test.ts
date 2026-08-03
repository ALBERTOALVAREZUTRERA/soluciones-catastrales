import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
    getDocumentedUrbanProfile,
    getJaenMunicipalValuationReference,
    getOfficialMunicipalReferenceUrl,
    getOfficialMunicipalValuationMapUrl,
    getPossibleAssessmentApprovalYears,
    requiresParcelSpecificAssessmentYear,
    JAEN_MUNICIPAL_VALUATION_REFERENCES,
} from "../../src/data/cadastral-municipal-profiles";

describe("registro municipal de valoración de Jaén", () => {
    test("incluye los 97 municipios sin identificadores ni códigos duplicados", () => {
        assert.equal(JAEN_MUNICIPAL_VALUATION_REFERENCES.length, 97);
        assert.equal(
            new Set(JAEN_MUNICIPAL_VALUATION_REFERENCES.map(({ id }) => id)).size,
            97,
        );
        assert.equal(
            new Set(JAEN_MUNICIPAL_VALUATION_REFERENCES.map(({ municipalityCode }) => municipalityCode)).size,
            97,
        );
    });

    test("cada ponencia produce efectos en el ejercicio siguiente a su aprobación", () => {
        for (const reference of JAEN_MUNICIPAL_VALUATION_REFERENCES) {
            assert.equal(
                reference.assessmentEffectiveYear,
                reference.assessmentApprovalYear + 1,
                reference.name,
            );
        }
    });

    test("conserva los códigos especiales y fechas oficiales sensibles", () => {
        assert.deepEqual(getJaenMunicipalValuationReference("Andújar (Jaén)"), {
            id: "23005",
            municipalityCode: 5,
            name: "Andújar",
            assessmentApprovalYear: 2010,
            assessmentEffectiveYear: 2011,
        });
        const jaen = getJaenMunicipalValuationReference("Jaen");
        assert.equal(jaen?.municipalityCode, 900);
        assert.equal(jaen?.assessmentPublicationDate, "1996-04-24");
        assert.deepEqual(jaen?.partialValuations, [
            { assessmentApprovalYear: 2000, assessmentEffectiveYear: 2001, assessmentPublicationDate: "2000-11-15" },
            { assessmentApprovalYear: 2003, assessmentEffectiveYear: 2004, assessmentPublicationDate: "2003-10-23" },
        ]);
        assert.equal(getJaenMunicipalValuationReference("Cárcheles")?.municipalityCode, 23);
        assert.equal(getJaenMunicipalValuationReference("Villatorres")?.municipalityCode, 100);
        assert.equal(getJaenMunicipalValuationReference("Arroyo del Ojanco")?.municipalityCode, 102);
    });

    test("genera el enlace oficial con provincia y código catastral", () => {
        const reference = getJaenMunicipalValuationReference("Jaén");
        assert.ok(reference);
        const url = getOfficialMunicipalReferenceUrl(reference);
        assert.match(url, /municipio=900/);
        assert.match(url, /provincia=23/);
        assert.match(getOfficialMunicipalValuationMapUrl(reference), /del=23/);
        assert.match(getOfficialMunicipalValuationMapUrl(reference), /mun=900/);
    });

    test("exige resolver la ponencia por parcela cuando existen parciales", () => {
        const jaen = getJaenMunicipalValuationReference("Jaén");
        const andujar = getJaenMunicipalValuationReference("Andújar");
        assert.ok(jaen);
        assert.deepEqual(getPossibleAssessmentApprovalYears(jaen), [1996, 2000, 2003]);
        assert.equal(requiresParcelSpecificAssessmentYear(jaen), true);
        assert.equal(requiresParcelSpecificAssessmentYear(andujar), false);
    });

    test("Andújar, Úbeda y Alcalá disponen de módulos urbanos documentados", () => {
        assert.equal(getDocumentedUrbanProfile("Andujar")?.assessmentApprovalYear, 2010);
        assert.equal(getDocumentedUrbanProfile("Andujar")?.tipoUrbano, 0.00593);
        assert.equal(getDocumentedUrbanProfile("Andujar")?.gb, 1.3);
        assert.equal(getDocumentedUrbanProfile("Úbeda")?.mbc, 550);
        assert.equal(getDocumentedUrbanProfile("Úbeda")?.tipoUrbano, 0.0079);
        assert.equal(getDocumentedUrbanProfile("Alcalá la Real")?.mbc, 500);
        assert.equal(getDocumentedUrbanProfile("Alcalá la Real")?.tipoUrbano, 0.00499);
        assert.equal(getDocumentedUrbanProfile("Baeza"), null);
    });
});
