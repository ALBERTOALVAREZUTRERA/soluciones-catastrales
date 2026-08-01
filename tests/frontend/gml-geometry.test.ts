import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
    calculatePlanarArea,
    normalizeCadastralCrs,
    normalizeCadastralRing,
    ringArea,
} from "../../src/lib/gml-geometry";

describe("geometría y generación GML", () => {
    test("cierra y orienta exterior e interiores de forma coherente", () => {
        const clockwiseExterior = [[0, 0], [0, 10], [10, 10], [10, 0]];
        const counterClockwiseHole = [[2, 2], [8, 2], [8, 8], [2, 8]];

        const exterior = normalizeCadastralRing(clockwiseExterior);
        const hole = normalizeCadastralRing(counterClockwiseHole, true);

        assert.deepEqual(exterior[0], exterior.at(-1));
        assert.deepEqual(hole[0], hole.at(-1));
        assert.ok(ringArea(exterior) > 0);
        assert.ok(ringArea(hole) < 0);
    });

    test("calcula el área UTM como superficie plana y descuenta huecos", () => {
        const area = calculatePlanarArea({
            type: "Polygon",
            coordinates: [
                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                [[2, 2], [2, 4], [4, 4], [4, 2], [2, 2]],
            ],
        });

        assert.equal(area, 96);
    });

    test("solo admite los sistemas catastrales configurados", () => {
        assert.equal(normalizeCadastralCrs("EPSG:25829"), "25829");
        assert.equal(normalizeCadastralCrs("32628"), "32628");
        assert.throws(() => normalizeCadastralCrs("EPSG:4326"), /no está admitido/i);
    });

    test("genera anillos cerrados, área entera y EPSG seleccionado", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { generateGml } = await import("../../src/lib/gml-utils");
        const gml = generateGml([{
            id: "PARCELA PRUEBA",
            geometry: [[[500000, 4200000], [500010, 4200000], [500010, 4200010], [500000, 4200010]]],
        }], "EPSG:25831");

        assert.match(gml, /srsName="http:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/25831"/);
        assert.match(gml, /<cp:areaValue uom="m2">100<\/cp:areaValue>/);
        assert.match(gml, /count="5"/);
        assert.match(gml, /500000\.00 4200000\.00[\s\S]*500000\.00 4200000\.00/);
        assert.doesNotMatch(gml, /2025-01-01/);
    });

    test("rechaza anillos degenerados y huecos exteriores", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { generateGml } = await import("../../src/lib/gml-utils");
        assert.throws(
            () => normalizeCadastralRing([[0, 0], [0, 0], [1, 1]]),
            /tres vértices distintos/i,
        );
        assert.throws(
            () => generateGml([{
                id: "PARCELA",
                geometry: [
                    [[0, 0], [10, 0], [10, 10], [0, 10]],
                    [[20, 20], [22, 20], [22, 22], [20, 22]],
                ],
            }], "25830"),
            /hueco fuera/i,
        );
    });
});
