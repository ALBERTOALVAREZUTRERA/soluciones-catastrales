import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { join } from "node:path";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("accesibilidad estructural", () => {
  test("ofrece un salto de teclado y un destino en todas las páginas públicas", () => {
    const layout = readSource("src/app/layout.tsx");
    assert.match(layout, /href="#contenido-principal"/);

    const pages = [
      "src/app/page.tsx",
      "src/app/servicios/page.tsx",
      "src/app/tramites-catastrales/page.tsx",
      "src/app/tramites-registrales/page.tsx",
      "src/app/herramientas/calculadora/page.tsx",
      "src/app/herramientas/calculadora-rustica/page.tsx",
      "src/app/herramientas/conversor-edificio/page.tsx",
      "src/app/herramientas/conversor-gml/page.tsx",
      "src/app/herramientas/visor-catastral/page.tsx",
      "src/app/legal/aviso-legal/page.tsx",
      "src/app/legal/cookies/page.tsx",
      "src/app/legal/privacidad/page.tsx",
      "src/app/legal/terminos/page.tsx",
    ];

    for (const page of pages) {
      const source = readSource(page);
      assert.match(source, /<main[^>]+id="contenido-principal"/, page);
      assert.match(source, /tabIndex=\{-1\}/, page);
    }
  });

  test("el menú móvil expone estado, control y cierre por teclado", () => {
    const navbar = readSource("src/components/navbar.tsx");

    assert.match(navbar, /aria-label="Navegación principal"/);
    assert.match(navbar, /aria-expanded=\{isOpen\}/);
    assert.match(navbar, /aria-controls="menu-movil"/);
    assert.match(navbar, /event\.key === "Escape"/);
    assert.match(navbar, /aria-current=/);
  });

  test("respeta la preferencia de movimiento reducido y mantiene foco visible", () => {
    const css = readSource("src/app/globals.css");

    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /\.skip-link:focus/);
  });

  test("los CTA largos no fuerzan desplazamiento horizontal en móvil", () => {
    const leadMagnet = readSource("src/components/shared/lead-magnet.tsx");
    assert.match(leadMagnet, /w-full sm:w-auto/);
    assert.match(leadMagnet, /whitespace-normal/);
  });

  test("los formularios principales anuncian carga y facilitan autocompletado", () => {
    const sources = [
      readSource("src/components/hero.tsx"),
      readSource("src/components/process-portal.tsx"),
      readSource("src/components/lead-magnet.tsx"),
      readSource("src/components/topography-quiz.tsx"),
    ].join("\n");

    assert.match(sources, /autoComplete="name"/);
    assert.match(sources, /autoComplete="email"/);
    assert.match(sources, /autoComplete="tel"/);
    assert.match(sources, /aria-busy=/);
  });

  test("las herramientas relacionan cada etiqueta visible con su control", () => {
    const calculator = readSource("src/components/tools/urban-calculator.tsx");
    const valuationPage = readSource("src/app/herramientas/calculadora/page.tsx");
    const building = readSource("src/components/tools/building-converter.tsx");
    const parcel = readSource("src/components/tools/gml-converter.tsx");

    for (const id of [
      "urban-use",
      "urban-category",
      "urban-built-area",
      "urban-construction-year",
      "urban-condition",
      "urban-land-method",
      "urban-land-value",
      "urban-potential-area",
      "urban-land-area",
    ]) {
      assert.match(calculator, new RegExp(`htmlFor="${id}"`));
      assert.match(calculator, new RegExp(`id="${id}"`));
    }

    for (const id of [
      "valuation-municipality",
      "valuation-property-class",
      "valuation-gb",
      "valuation-land-corrector",
      "valuation-joint-corrector",
    ]) {
      assert.match(valuationPage, new RegExp(`htmlFor="${id}"`));
      assert.match(valuationPage, new RegExp(`id="${id}"`));
    }

    assert.match(building, /htmlFor="building-crs"/);
    assert.match(building, /htmlFor="building-file"/);
    assert.ok(parcel.includes('htmlFor={`files-${format}`}'));
    assert.ok(parcel.includes('id={`files-${format}`}'));
  });
});
