import assert from "node:assert/strict";
import test from "node:test";

import { generateDXFWithBackend } from "../../src/lib/backend-api";


test("la descarga conserva el archivo binario generado", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    assert.ok(init?.signal);
    return new Response(new Blob(["DXF"]), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await generateDXFWithBackend([], "25830");
    assert.equal(await result.text(), "DXF");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("la descarga muestra el detalle seguro devuelto por el backend", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ detail: "La geometría no es válida" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  )) as typeof fetch;

  try {
    await assert.rejects(
      generateDXFWithBackend([], "25830"),
      /La geometría no es válida/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("la descarga rechaza archivos vacíos y esperas agotadas", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response(new Blob([]), { status: 200 })) as typeof fetch;
    await assert.rejects(generateDXFWithBackend([], "25830"), /archivo generado está vacío/);

    globalThis.fetch = (async () => {
      throw new DOMException("cancelada", "AbortError");
    }) as typeof fetch;
    await assert.rejects(generateDXFWithBackend([], "25830"), /tiempo de espera/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
