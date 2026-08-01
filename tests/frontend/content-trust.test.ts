import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { join } from "node:path";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("contenido comercial verificable", () => {
  test("la portada no publica métricas ni promesas de resultado sin respaldo", () => {
    const home = readSource("src/app/page.tsx");
    const processPortal = readSource("src/components/process-portal.tsx");
    const content = `${home}\n${processPortal}`;

    for (const unsupportedClaim of [
      "5.000+",
      "98%",
      "Casos de Éxito",
      "Respuesta Técnica",
      "menos de 24 horas",
      "valor exacto",
      "Simulador oficial",
    ]) {
      assert.doesNotMatch(content, new RegExp(unsupportedClaim, "i"));
    }
  });

  test("las llamadas principales llevan al formulario desde cualquier ruta", () => {
    const navbar = readSource("src/components/navbar.tsx");
    const faq = readSource("src/components/technical-faq.tsx");
    const serviceCard = readSource("src/components/service-card.tsx");

    assert.match(navbar, /href="\/#tramites"/);
    assert.match(faq, /href="\/#tramites"/);
    assert.match(serviceCard, /href="\/#tramites"/);
  });

  test("el pie ofrece contacto real y no contiene enlaces vacíos", () => {
    const footer = readSource("src/components/footer.tsx");

    assert.match(footer, /href="tel:\+34665890608"/);
    assert.match(
      footer,
      /href="mailto:alberto\.alvarez\.utrera@gmail\.com"/,
    );
    assert.match(footer, /Calle Nueva nº 5, Andújar \(Jaén\)/);
    assert.doesNotMatch(footer, /href="#"/);
  });

  test("WhatsApp es un enlace accesible y seguro", () => {
    const whatsapp = readSource("src/components/whatsapp-button.tsx");

    assert.match(whatsapp, /href="https:\/\/wa\.me\/34665890608/);
    assert.match(whatsapp, /aria-label="Consultar por WhatsApp"/);
    assert.match(whatsapp, /rel="noopener noreferrer"/);
  });
});
