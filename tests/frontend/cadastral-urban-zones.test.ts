import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
    getMunicipalUrbanZoneRegistry,
    getOfficialZoneLandValue,
    getRepercussionUse,
    MUNICIPAL_URBAN_ZONE_REGISTRIES,
} from "../../src/data/cadastral-urban-zones";
import { getDocumentedUrbanProfile } from "../../src/data/cadastral-municipal-profiles";
import { calculateUrbanValuation } from "../../src/lib/cadastral-valuation";

describe("zonas urbanas documentadas", () => {
    test("registra Andújar, Úbeda y Alcalá sin códigos de zona duplicados", () => {
        assert.equal(MUNICIPAL_URBAN_ZONE_REGISTRIES.length, 3);
        for (const registry of MUNICIPAL_URBAN_ZONE_REGISTRIES) {
            assert.equal(new Set(registry.zones.map(({ code }) => code)).size, registry.zones.length);
            assert.match(registry.sourceUrl, /catastro\.meh\.es/);
        }
        assert.equal(getMunicipalUrbanZoneRegistry("Andujar (Jaén)")?.zones.length, 16);
        assert.equal(getMunicipalUrbanZoneRegistry("Úbeda (Jaén)")?.zones.length, 19);
        assert.equal(getMunicipalUrbanZoneRegistry("Alcala la Real")?.zones.length, 16);
    });

    test("conserva valores sensibles publicados para Andújar", () => {
        const registry = getMunicipalUrbanZoneRegistry("Andújar");
        assert.ok(registry);
        const r37c = registry.zones.find(({ code }) => code === "R37C");
        const u49 = registry.zones.find(({ code }) => code === "U49");
        assert.ok(r37c);
        assert.ok(u49);
        assert.equal(getOfficialZoneLandValue(r37c, "AAP"), 423);
        assert.equal(getOfficialZoneLandValue(r37c, "COM"), 575);
        assert.equal(getOfficialZoneLandValue(r37c, "IAL"), 296);
        assert.equal(getOfficialZoneLandValue(r37c, "GAR"), 63.45);
        assert.equal(getOfficialZoneLandValue(u49, "AAP"), 26);
    });

    test("conserva valores sensibles publicados para Úbeda", () => {
        const registry = getMunicipalUrbanZoneRegistry("Úbeda");
        assert.ok(registry);
        const r29c = registry.zones.find(({ code }) => code === "R29C");
        const u45 = registry.zones.find(({ code }) => code === "U45");
        assert.ok(r29c);
        assert.ok(u45);
        assert.equal(getOfficialZoneLandValue(r29c, "AAP"), 925);
        assert.equal(getOfficialZoneLandValue(r29c, "COM"), 1200);
        assert.equal(getOfficialZoneLandValue(r29c, "IAL"), 305);
        assert.equal(getOfficialZoneLandValue(u45, "AAP"), 70);
    });

    test("conserva valores sensibles publicados para Alcalá la Real", () => {
        const registry = getMunicipalUrbanZoneRegistry("Alcalá la Real");
        assert.ok(registry);
        const r34c = registry.zones.find(({ code }) => code === "R34C");
        const u49 = registry.zones.find(({ code }) => code === "U49");
        assert.ok(r34c);
        assert.ok(u49);
        assert.equal(getOfficialZoneLandValue(r34c, "AAP"), 650);
        assert.equal(getOfficialZoneLandValue(r34c, "COM"), 900);
        assert.equal(getOfficialZoneLandValue(r34c, "GAR"), 97.5);
        assert.equal(getOfficialZoneLandValue(u49, "V"), 32);
    });

    test("no inventa equivalencias para tipologías sin columna específica", () => {
        const registry = getMunicipalUrbanZoneRegistry("Úbeda");
        const zone = registry?.zones.find(({ code }) => code === "R35");
        assert.ok(zone);
        assert.equal(getRepercussionUse("KPS"), null);
        assert.equal(getRepercussionUse("ESC"), null);
        assert.equal(getOfficialZoneLandValue(zone, "KPS"), null);
    });

    test("calcula casos residenciales reproducibles de los tres municipios", () => {
        const cases = [
            { municipality: "Andújar", zoneCode: "R37C", method: "repercussion" as const, expectedLand: 27_495, expectedTotal: 56_363.13 },
            { municipality: "Úbeda", zoneCode: "R35", method: "repercussion" as const, expectedLand: 39_000, expectedTotal: 70_245.5 },
            { municipality: "Alcalá la Real", zoneCode: "U35", method: "unit" as const, expectedLand: 16_315, expectedTotal: 44_720 },
        ];

        for (const scenario of cases) {
            const registry = getMunicipalUrbanZoneRegistry(scenario.municipality);
            const profile = getDocumentedUrbanProfile(scenario.municipality);
            const zone = registry?.zones.find(({ code }) => code === scenario.zoneCode);
            assert.ok(profile);
            assert.ok(zone);
            const landValue = getOfficialZoneLandValue(zone, "AAP");
            assert.ok(landValue);

            const result = calculateUrbanValuation({
                soilArea: 100,
                constructionArea: 100,
                potentialConstructionArea: 0,
                landValuationMethod: scenario.method,
                landValue,
                landCorrector: 1,
                promotionCoefficient: profile.gb,
                jointCorrector: 1,
                marketCoefficient: profile.rm,
                basicConstructionModule: profile.mbc,
                constructionTypeCoefficient: 0.95,
                conservationCoefficient: 1,
                assessmentApprovalYear: profile.assessmentApprovalYear,
                constructionYear: 2000,
                typeId: "AAP",
                category: 5,
                ibiRate: profile.tipoUrbano,
            });

            assert.equal(result.soilValue, scenario.expectedLand);
            assert.equal(result.totalValue, scenario.expectedTotal);
        }
    });
});
