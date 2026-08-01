import assert from "node:assert/strict";
import { describe, test } from "node:test";

import nextConfig from "../../next.config";
import {
  SOCIAL_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  createPageMetadata,
} from "../../src/lib/site-config";

describe("metadatos SEO", () => {
  test("construye URL absolutas sin duplicar barras", () => {
    assert.equal(SITE_URL, "https://www.solucionescatastrales.app");
    assert.equal(
      absoluteUrl("/herramientas/conversor-gml"),
      "https://www.solucionescatastrales.app/herramientas/conversor-gml",
    );
  });

  test("crea canonical, Open Graph y Twitter coherentes", () => {
    const metadata = createPageMetadata({
      title: "Conversor GML",
      description: "Convierte archivos catastrales.",
      path: "/herramientas/conversor-gml",
    });

    assert.equal(
      metadata.alternates?.canonical,
      absoluteUrl("/herramientas/conversor-gml"),
    );
    assert.equal(metadata.openGraph?.siteName, SITE_NAME);
    assert.equal(metadata.openGraph?.url, absoluteUrl("/herramientas/conversor-gml"));
    assert.equal(
      (metadata.twitter as { card?: string } | undefined)?.card,
      "summary_large_image",
    );

    const images = metadata.openGraph?.images;
    assert.ok(Array.isArray(images));
    const firstImage = images[0];
    assert.ok(
      firstImage &&
        typeof firstImage === "object" &&
        "url" in firstImage,
      "Open Graph debe incluir una imagen descrita",
    );
    assert.equal(firstImage.url, absoluteUrl(SOCIAL_IMAGE_PATH));
  });
});

describe("cabeceras de seguridad", () => {
  test("aplica las protecciones principales a todas las rutas", async () => {
    assert.equal(typeof nextConfig.headers, "function");
    const rules = await nextConfig.headers!();
    const globalRule = rules.find((rule) => rule.source === "/(.*)");
    assert.ok(globalRule);

    const headers = Object.fromEntries(
      globalRule.headers.map(({ key, value }) => [key, value]),
    );

    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.match(headers["Strict-Transport-Security"], /max-age=/);
    assert.match(headers["Permissions-Policy"], /camera=\(\)/);
    assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
    assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
    assert.match(headers["Content-Security-Policy"], /form-action 'self'/);
  });
});
