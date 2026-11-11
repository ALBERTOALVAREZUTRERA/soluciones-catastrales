import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { GUIAS, getGuia } from "../../src/data/guias";

describe("guías por problema", () => {
  test("cada guía tiene URL única y contenido completo", () => {
    const slugs = GUIAS.map((guia) => guia.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const guia of GUIAS) {
      assert.match(guia.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.ok(guia.description.length >= 120 && guia.description.length <= 260, guia.slug);
      assert.ok(guia.pasos.length >= 3 && guia.faqs.length >= 3, guia.slug);
      for (const link of guia.relacionados) assert.match(link.href, /^\//);
    }
    assert.equal(getGuia("no-existe"), null);
  });
});
