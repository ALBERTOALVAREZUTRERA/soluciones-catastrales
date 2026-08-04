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

        assert.match(gml, /srsName="urn:ogc:def:crs:EPSG::25831"/);
        assert.match(gml, /<cp:areaValue uom="m2">100<\/cp:areaValue>/);
        assert.match(gml, /count="5"/);
        assert.match(gml, /500000\.00 4200000\.00[\s\S]*500000\.00 4200000\.00/);
        assert.doesNotMatch(gml, /2025-01-01/);
    });

    test("distingue etiquetas urbanas, rústicas y referencias locales", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { cadastralParcelLabel, generateGml } = await import("../../src/lib/gml-utils");

        assert.equal(cadastralParcelLabel("4067954VH2137S"), "54");
        assert.equal(cadastralParcelLabel("23039A04900005"), "5");

        const rustic = generateGml([{
            id: "23039A04900005",
            geometry: [[[0, 0], [10, 0], [10, 10], [0, 10]]],
        }], "25830");
        assert.match(rustic, /<cp:label>5<\/cp:label>/);
        assert.match(rustic, /<cp:nationalCadastralReference>23039A04900005<\/cp:nationalCadastralReference>/);

        const propertyReference = generateGml([{
            id: "4067954VH2137S0001AB",
            geometry: [[[0, 0], [10, 0], [10, 10], [0, 10]]],
        }], "25830");
        assert.match(propertyReference, /<localId>4067954VH2137S<\/localId>/);
        assert.match(propertyReference, /<cp:nationalCadastralReference>4067954VH2137S<\/cp:nationalCadastralReference>/);
        assert.doesNotMatch(propertyReference, /4067954VH2137S0001AB/);
        assert.throws(
            () => generateGml([
                {
                    id: "4067954VH2137S0001AB",
                    geometry: [[[0, 0], [10, 0], [10, 10], [0, 10]]],
                },
                {
                    id: "4067954VH2137S0002CD",
                    geometry: [[[20, 0], [30, 0], [30, 10], [20, 10]]],
                },
            ], "25830"),
            /está repetida/i,
        );

        const local = generateGml([{
            id: "FINCA LOCAL",
            geometry: [[[0, 0], [10, 0], [10, 10], [0, 10]]],
        }], "25830");
        assert.match(local, /<namespace>ES\.LOCAL\.CP<\/namespace>/);
        assert.match(local, /<cp:nationalCadastralReference\/>/);
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

    test("rechaza declaraciones XML peligrosas antes de interpretar un GML", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { parseGml } = await import("../../src/lib/gml-utils");

        assert.throws(
            () => parseGml('<!DOCTYPE gml [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><gml/>', "prueba"),
            /declaraciones no permitidas/i,
        );
    });

    test("detecta solapes dentro del mismo archivo y respeta conflictos del backend", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { validateTopology } = await import("../../src/lib/gml-utils");
        const issues = validateTopology([{
            name: "parcelas.dxf",
            features: [
                { id: "A", geometry: [[[0, 0], [10, 0], [10, 10], [0, 10]]] },
                { id: "B", geometry: [[[8, 0], [18, 0], [18, 10], [8, 10]]] },
            ],
        }]);
        assert.equal(issues.length, 1);
        assert.match(issues[0].message, /20\.00 m²/);

        const backendIssue = validateTopology([{
            name: "backend.dxf",
            features: [{
                id: "C",
                geometry: [[[20, 0], [30, 0], [30, 10], [20, 10]]],
                hasConflict: true,
            }],
        }]);
        assert.equal(backendIssue.length, 1);
        assert.match(backendIssue[0].message, /backend/i);
    });

    test("detecta el CRS declarado y rechaza recuentos de vértices incoherentes", async () => {
        Object.defineProperty(globalThis, "self", { value: globalThis, configurable: true });
        const { detectGmlCrs, parseGmlPositionList } = await import("../../src/lib/gml-utils");
        const gml = `<?xml version="1.0"?>
          <FeatureCollection xmlns="http://www.opengis.net/wfs/2.0"
            xmlns:gml="http://www.opengis.net/gml/3.2"
            xmlns:cp="http://inspire.ec.europa.eu/schemas/cp/4.0">
            <member><cp:CadastralParcel gml:id="ES.LOCAL.CP.TEST">
              <cp:geometry><gml:MultiSurface srsName="urn:ogc:def:crs:EPSG::25829">
                <gml:surfaceMember><gml:Surface><gml:patches><gml:PolygonPatch>
                  <gml:exterior><gml:LinearRing>
                    <gml:posList srsDimension="2" count="4">0 0 10 0 10 10 0 0</gml:posList>
                  </gml:LinearRing></gml:exterior>
                </gml:PolygonPatch></gml:patches></gml:Surface></gml:surfaceMember>
              </gml:MultiSurface></cp:geometry>
            </cp:CadastralParcel></member>
          </FeatureCollection>`;

        assert.equal(detectGmlCrs(gml), "25829");
        assert.deepEqual(
            parseGmlPositionList("0 0 10 0 10 10 0 0", "2", "4"),
            [[0, 0], [10, 0], [10, 10], [0, 0]],
        );
        assert.throws(
            () => parseGmlPositionList("0 0 10 0 10 10 0 0", "2", "5"),
            /count/i,
        );
        assert.throws(
            () => detectGmlCrs(gml.replace("25829", "4326")),
            /no está admitido/i,
        );
    });
});
