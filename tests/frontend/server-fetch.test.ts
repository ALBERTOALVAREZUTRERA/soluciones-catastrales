import assert from "node:assert/strict";
import { test } from "node:test";

import { fetchWithRetry } from "../../src/lib/server-fetch";

test("reintenta una consulta GET ante un 503 transitorio", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  let calls = 0;
  const warnings: string[] = [];
  globalThis.fetch = (async () => {
    calls += 1;
    return calls === 1
      ? new Response("temporal", { status: 503 })
      : new Response("ok", { status: 200 });
  }) as typeof fetch;
  console.warn = (value?: unknown) => warnings.push(String(value));

  try {
    const response = await fetchWithRetry(
      "https://example.test/data",
      { method: "GET" },
      {
        attempts: 2,
        baseDelayMs: 0,
        requestId: "retry-request-1234",
        service: "test_upstream",
        timeoutMs: 1_000,
      },
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "ok");
    assert.equal(calls, 2);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /upstream_retry/);
    assert.doesNotMatch(warnings[0], /example\.test\/data/);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("no reintenta un 404 ni permite métodos con efectos laterales", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response("no encontrado", { status: 404 });
  }) as typeof fetch;

  try {
    const response = await fetchWithRetry(
      "https://example.test/missing",
      { method: "GET" },
      {
        baseDelayMs: 0,
        requestId: "retry-request-5678",
        service: "test_upstream",
      },
    );
    assert.equal(response.status, 404);
    assert.equal(calls, 1);

    await assert.rejects(() => fetchWithRetry(
      "https://example.test/send",
      { method: "POST" },
      {
        requestId: "retry-request-9012",
        service: "test_upstream",
      },
    ), /idempotentes/);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
