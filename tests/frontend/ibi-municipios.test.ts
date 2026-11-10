import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  IBI_MUNICIPIOS,
  formatRate,
  getIbiMunicipio,
  slugifyMunicipio,
} from "../../src/lib/ibi-municipios";

describe("páginas de IBI por municipio", () => {
  test("cada municipio tiene una URL única y válida", () => {
    const slugs = IBI_MUNICIPIOS.map((item) => item.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("normaliza tildes y formatea el tipo de gravamen", () => {
    assert.equal(slugifyMunicipio("Bélmez de la Moraleda"), "belmez-de-la-moraleda");
    assert.equal(getIbiMunicipio("andujar")?.name, "Andújar");
    assert.equal(getIbiMunicipio("no-existe"), null);
    assert.equal(formatRate(0.00593).replace(/\s/g, " "), "0,593 %");
    assert.equal(formatRate(0.006).replace(/\s/g, " "), "0,60 %");
  });
});
