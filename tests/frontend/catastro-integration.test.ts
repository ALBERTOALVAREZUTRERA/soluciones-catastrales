import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../../src/app/api/catastro-rustica/route";
import {
  isValidCadastralReference,
  normalizeCadastralReference,
} from "../../src/lib/catastro-reference";
import {
  CATASTRO_WMS_LAYER,
  CATASTRO_WMS_URL,
  HISTORIC_CADASTRE_START_YEAR,
  PONENCIAS_WMS_LAYERS,
  PONENCIAS_WMS_URL,
  historicCadastreDate,
} from "../../src/lib/map-services";

const RUSTIC_XML = `<?xml version="1.0" encoding="utf-8"?>
<consulta_dnp xmlns="http://www.catastro.meh.es/">
  <control><cudnp>1</cudnp><cucul>1</cucul></control>
  <bico>
    <bi>
      <idbi><cn>RU</cn></idbi>
      <dt><np>JAÉN</np><nm>ANDUJAR</nm></dt>
      <ldt>Polígono 1 Parcela 1 VICARIA</ldt>
      <debi><luso>Agrario</luso><sfc>0</sfc></debi>
    </bi>
    <finca><dff><ss>12034</ss></dff></finca>
    <lspr><spr><cspr>0</cspr><dspr><ccc>O-</ccc><dcc>OLIVOS SECANO</dcc><ip>01</ip><ssp>12034</ssp></dspr></spr></lspr>
  </bico>
</consulta_dnp>`;

test("el proxy rústico usa WCF y conserva superficies y cultivos", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = input.toString();
    return new Response(RUSTIC_XML, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }) as typeof fetch;

  try {
    const response = await GET(
      new Request("http://localhost/api/catastro-rustica?rc=23005A00100001"),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.match(requestedUrl, /COVCCallejero\.svc\/rest\/Consulta_DNPRC/);
    assert.match(requestedUrl, /RefCat=23005A00100001/);
    assert.equal(payload.superficieParcela, 12034);
    assert.equal(payload.subparcelas.length, 1);
    assert.equal(payload.subparcelas[0].descripcion, "OLIVOS SECANO");
    assert.equal(payload.subparcelas[0].superficieHa, 1.2034);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("el proxy rústico rechaza referencias con longitud o caracteres inválidos", async () => {
  for (const reference of ["123", "1234567890123!"]) {
    const response = await GET(
      new Request(`http://localhost/api/catastro-rustica?rc=${reference}`),
    );
    assert.equal(response.status, 400);
  }
});

test("el proxy reintenta una caída transitoria y conserva la referencia", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  let calls = 0;
  console.warn = () => undefined;
  globalThis.fetch = (async () => {
    calls += 1;
    return calls === 1
      ? new Response("temporal", { status: 503 })
      : new Response(RUSTIC_XML, { status: 200 });
  }) as typeof fetch;

  try {
    const response = await GET(new Request(
      "http://localhost/api/catastro-rustica?rc=23005A00100001",
      { headers: { "X-Request-ID": "catastro-retry-1234" } },
    ));

    assert.equal(response.status, 200);
    assert.equal(calls, 2);
    assert.equal(response.headers.get("X-Request-ID"), "catastro-retry-1234");
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("normaliza referencias pegadas con espacios y exige longitudes oficiales", () => {
  assert.equal(
    normalizeCadastralReference("2749704 yj0624n 0001 di"),
    "2749704YJ0624N0001DI",
  );
  assert.equal(isValidCadastralReference("2749704YJ0624N"), true);
  assert.equal(isValidCadastralReference("2749704YJ0624N0001"), true);
  assert.equal(isValidCadastralReference("2749704YJ0624N0001DI"), true);
  assert.equal(isValidCadastralReference("2749704YJ0624N!"), false);
});

test("configura capas WMS publicadas y limita la consulta histórica estable", () => {
  assert.match(CATASTRO_WMS_URL, /ServidorWMS\.aspx$/);
  assert.equal(CATASTRO_WMS_LAYER, "Catastro");
  assert.match(PONENCIAS_WMS_URL, /ponenciasWMS\.aspx$/);
  assert.equal(PONENCIAS_WMS_LAYERS, "ZONA VALOR,TEXTO ZONA VALOR");
  assert.equal(HISTORIC_CADASTRE_START_YEAR, 2005);
  assert.equal(historicCadastreDate(2002), "2005-01-01");
});
