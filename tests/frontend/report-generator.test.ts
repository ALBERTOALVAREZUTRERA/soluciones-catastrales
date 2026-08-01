import assert from "node:assert/strict";
import test from "node:test";

import {
  createTechnicalReportPdf,
  createValuationPdf,
} from "../../src/lib/report-generator";

const circle = Array.from({ length: 100 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 100;
  return [500000 + Math.cos(angle) * 50, 4200000 + Math.sin(angle) * 50];
});

test("el informe de coordenadas pagina listados largos", () => {
  const document = createTechnicalReportPdf([{
    id: "PARCELA",
    area: 0,
    geometry: [[...circle, [...circle[0]]]],
  }], "EPSG:25830");
  assert.ok(document.getNumberOfPages() > 1);
  assert.ok(document.output("arraybuffer").byteLength > 10_000);
});

test("el informe de valoración rechaza importes y años imposibles", () => {
  const base = {
    referenciaCatastral: "",
    municipio: "Andújar",
    clase: "Urbano",
    uso: "Residencial",
    superficie: 100,
    anioConstruccion: 2000,
    mbc: 500,
    mbr: 300,
    rm: 0.5,
    gb: 1.4,
    valorSuelo: 10_000,
    valorConstruccion: 20_000,
    valorTotal: 30_000,
  };
  assert.throws(() => createValuationPdf({ ...base, valorTotal: -1 }), /no válidos/);
  assert.throws(() => createValuationPdf({ ...base, anioConstruccion: 999 }), /no válidos/);
});
