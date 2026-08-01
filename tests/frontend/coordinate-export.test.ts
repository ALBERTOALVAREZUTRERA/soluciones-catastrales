import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";

import {
  buildCoordinateExport,
  createCoordinatesCsv,
  createCoordinatesXlsx,
} from "../../src/lib/coordinate-export";

const feature = {
  id: "=PARCELA;1",
  cadastralReference: "1234567AB1234C0001DE",
  area: 999,
  geometry: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[2, 2], [2, 4], [4, 4], [4, 2], [2, 2]],
  ],
};

test("las tablas recalculan el área y no duplican el vértice de cierre", () => {
  const result = buildCoordinateExport([feature]);
  assert.equal(result.rows.length, 8);
  assert.equal(result.summaries[0].vertices, 8);
  assert.equal(result.summaries[0].holes, 1);
  assert.equal(result.summaries[0].area, 96);
});

test("el CSV usa UTF-8, escapa separadores y neutraliza fórmulas", () => {
  const csv = createCoordinatesCsv([feature], "EPSG:25830");
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"'=PARCELA;1"/);
  assert.match(csv, /"96\.00"/);
  assert.equal(csv.split("\r\n").length, 9);
});

test("el Excel es un OOXML real con resumen, filtros y fórmulas", async () => {
  const blob = await createCoordinatesXlsx([feature], "EPSG:25830");
  const archive = await JSZip.loadAsync(await blob.arrayBuffer());
  const names = Object.keys(archive.files);
  assert.ok(names.includes("xl/workbook.xml"));
  assert.ok(names.includes("xl/worksheets/sheet1.xml"));
  assert.ok(names.includes("xl/worksheets/sheet2.xml"));

  const workbook = await archive.file("xl/workbook.xml")!.async("string");
  const summary = await archive.file("xl/worksheets/sheet1.xml")!.async("string");
  assert.match(workbook, /name="Resumen"/);
  assert.match(workbook, /name="Coordenadas"/);
  assert.match(summary, /SUM\(C5:C5\)/);
  assert.match(summary, /COUNTIFS\(/);
  assert.match(summary, /<autoFilter ref="A4:E5"/);
});
