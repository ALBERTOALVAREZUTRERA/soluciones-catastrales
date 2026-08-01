import assert from "node:assert/strict";
import { test } from "node:test";

import {
  apiError,
  getRequestId,
  logApiError,
  REQUEST_ID_HEADER,
} from "../../src/lib/api-observability";
import { POST as submitContact } from "../../src/app/api/contact/route";

test("conserva identificadores válidos y reemplaza los manipulados", () => {
  const accepted = getRequestId(new Request("https://example.test", {
    headers: { [REQUEST_ID_HEADER]: "web-request-1234" },
  }));
  const replaced = getRequestId(new Request("https://example.test", {
    headers: { [REQUEST_ID_HEADER]: "bad" },
  }));

  assert.equal(accepted, "web-request-1234");
  assert.notEqual(replaced, "bad");
  assert.match(replaced, /^[0-9a-f-]{32,36}$/i);
});

test("los errores API incluyen código, referencia y cabecera", async () => {
  const response = apiError(
    "Solicitud incorrecta",
    "invalid_request",
    400,
    "web-request-5678",
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), "web-request-5678");
  assert.deepEqual(await response.json(), {
    error: "Solicitud incorrecta",
    code: "invalid_request",
    requestId: "web-request-5678",
  });
});

test("el formulario aplica el mismo contrato a validaciones", async () => {
  const response = await submitContact(new Request(
    "https://example.test/api/contact",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [REQUEST_ID_HEADER]: "contact-request-1234",
      },
      body: JSON.stringify({}),
    },
  ));
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), "contact-request-1234");
  assert.equal(payload.code, "validation_error");
  assert.equal(payload.requestId, "contact-request-1234");
  assert.equal(response.headers.get("RateLimit-Limit"), "5");
  assert.equal(response.headers.get("RateLimit-Remaining"), "4");
});

test("el log estructurado no incluye el mensaje potencialmente sensible", () => {
  const originalConsoleError = console.error;
  const calls: string[] = [];
  console.error = (value?: unknown) => calls.push(String(value));
  try {
    logApiError(
      "contact_submission_failed",
      "contact-request-9876",
      new Error("email=persona@example.com secreto=1234"),
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(calls.length, 1);
  const logged = JSON.parse(calls[0]);
  assert.equal(logged.requestId, "contact-request-9876");
  assert.equal(logged.errorType, "Error");
  assert.doesNotMatch(calls[0], /persona@example\.com|secreto=1234/);
});
