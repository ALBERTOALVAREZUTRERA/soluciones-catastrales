import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const appOutput = join(process.cwd(), ".next", "server", "app");
const siteUrl = "https://www.solucionescatastrales.app";

const routes = new Map([
  ["index.html", "/"],
  ["servicios.html", "/servicios"],
  ["tramites-catastrales.html", "/tramites-catastrales"],
  ["tramites-registrales.html", "/tramites-registrales"],
  ["herramientas/calculadora.html", "/herramientas/calculadora"],
  [
    "herramientas/calculadora-rustica.html",
    "/herramientas/calculadora-rustica",
  ],
  ["herramientas/conversor-gml.html", "/herramientas/conversor-gml"],
  [
    "herramientas/conversor-edificio.html",
    "/herramientas/conversor-edificio",
  ],
  ["herramientas/visor-catastral.html", "/herramientas/visor-catastral"],
]);

for (const [file, route] of routes) {
  const htmlPath = join(appOutput, ...file.split("/"));
  assert.ok(existsSync(htmlPath), `No se generó ${file}`);

  const html = readFileSync(htmlPath, "utf8");
  const expectedCanonical = route === "/" ? siteUrl : `${siteUrl}${route}`;

  assert.match(
    html,
    new RegExp(
      `<link rel="canonical" href="${expectedCanonical.replaceAll(".", "\\.")}"`,
    ),
    `Canonical incorrecta en ${route}`,
  );
  assert.match(html, /<meta property="og:image" content="[^"]+og-social\.jpg"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
}

const robots = readFileSync(join(appOutput, "robots.txt.body"), "utf8");
assert.match(robots, /Disallow: \/api\//);
assert.match(robots, new RegExp(`Sitemap: ${siteUrl.replaceAll(".", "\\.")}/sitemap.xml`));

const sitemap = readFileSync(join(appOutput, "sitemap.xml.body"), "utf8");
for (const route of routes.values()) {
  const expectedUrl = route === "/" ? `${siteUrl}/` : `${siteUrl}${route}`;
  assert.ok(sitemap.includes(`<loc>${expectedUrl}</loc>`), `Falta ${route} en sitemap`);
}

const socialImage = join(process.cwd(), "public", "og-social.jpg");
assert.ok(existsSync(socialImage), "Falta la imagen social");
assert.ok(statSync(socialImage).size > 100_000, "La imagen social parece incompleta");

console.log(`Build verificado: ${routes.size} rutas, robots, sitemap e imagen social.`);
