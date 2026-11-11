import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { SERVICIOS, getServicio } from "../../src/data/servicios";

describe("páginas de servicio", () => {
  test("cada servicio tiene URL única, contenido completo y enlaces válidos", () => {
    const slugs = SERVICIOS.map((servicio) => servicio.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const servicio of SERVICIOS) {
      assert.match(servicio.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.ok(servicio.description.length >= 110 && servicio.description.length <= 260, servicio.slug);
      assert.ok(servicio.cuando.length >= 3 && servicio.incluye.length >= 3 && servicio.faqs.length >= 2, servicio.slug);
      for (const related of servicio.relacionados) {
        assert.ok(getServicio(related), `${servicio.slug} -> ${related}`);
        assert.notEqual(related, servicio.slug);
      }
    }
  });
});
