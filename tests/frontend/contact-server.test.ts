import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  ContactRequestError,
  checkRateLimit,
  contactRequestSchema,
  createMailTransport,
  escapeHtml,
  getMailAddresses,
  isHoneypotFilled,
  leadMagnetRequestSchema,
  rateLimitHeaders,
  readLimitedJson,
} from "../../src/lib/contact-server";

const originalEmailUser = process.env.EMAIL_USER;
const originalContactEmail = process.env.CONTACT_EMAIL;

beforeEach(() => {
  globalThis.contactRateLimitStore?.clear();
});

afterEach(() => {
  if (originalEmailUser === undefined) delete process.env.EMAIL_USER;
  else process.env.EMAIL_USER = originalEmailUser;

  if (originalContactEmail === undefined) delete process.env.CONTACT_EMAIL;
  else process.env.CONTACT_EMAIL = originalContactEmail;
});

describe("validación de solicitudes", () => {
  test("acepta un contacto con email y consentimiento", () => {
    const result = contactRequestSchema.safeParse({
      name: "Laura García",
      email: "laura@example.com",
      phone: "",
      type: "Consulta catastral",
      ref: "23005A00100001",
      message: "Necesito revisar los linderos de mi parcela.",
      privacyAccepted: true,
      website: "",
    });

    assert.equal(result.success, true);
  });

  test("exige un medio de contacto y consentimiento", () => {
    const noContact = contactRequestSchema.safeParse({
      name: "Laura García",
      email: "",
      phone: "",
      type: "Consulta catastral",
      ref: "",
      message: "Necesito información sobre una parcela.",
      privacyAccepted: true,
      website: "",
    });
    const noConsent = leadMagnetRequestSchema.safeParse({
      name: "Laura García",
      contact: "laura@example.com",
      privacyAccepted: false,
      website: "",
    });

    assert.equal(noContact.success, false);
    assert.equal(noConsent.success, false);
  });

  test("rechaza referencias y campos adicionales no válidos", () => {
    const result = contactRequestSchema.safeParse({
      name: "Laura García",
      email: "laura@example.com",
      type: "Consulta catastral",
      ref: "../../secreto",
      message: "Necesito revisar los linderos.",
      privacyAccepted: true,
      website: "",
      admin: true,
    });

    assert.equal(result.success, false);
  });
});

describe("protecciones del formulario", () => {
  test("detecta el honeypot y escapa HTML", () => {
    assert.equal(isHoneypotFilled({ website: "https://spam.example" }), true);
    assert.equal(isHoneypotFilled({ website: "   " }), false);
    assert.equal(
      escapeHtml(`<script>alert("x")</script> & 'prueba'`),
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#039;prueba&#039;",
    );
  });

  test("bloquea la sexta petición del mismo origen", () => {
    const request = new Request("https://example.test/api/contact", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });

    let current;
    for (let requestNumber = 1; requestNumber <= 5; requestNumber += 1) {
      current = checkRateLimit(request, "test-contact");
      assert.equal(current.allowed, true);
    }

    const blocked = checkRateLimit(request, "test-contact");
    assert.equal(blocked.allowed, false);
    assert.equal(current?.remaining, 0);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds > 0);
    assert.deepEqual(rateLimitHeaders(blocked), {
      "RateLimit-Limit": "5",
      "RateLimit-Remaining": "0",
      "RateLimit-Reset": String(blocked.resetAfterSeconds),
      "Retry-After": String(blocked.retryAfterSeconds),
    });
  });

  test("valida la IP y mantiene acotado el almacén de cuotas", () => {
    const store = globalThis.contactRateLimitStore!;
    const resetAt = Date.now() + 60_000;
    for (let index = 0; index < 10_000; index += 1) {
      store.set(`filled:${index}`, { count: 1, resetAt });
    }

    checkRateLimit(new Request("https://example.test/api/contact", {
      headers: { "x-forwarded-for": "IP-manipulada" },
    }), "bounded");

    assert.equal(store.size, 10_000);
    assert.equal(store.has("filled:0"), false);
    assert.equal(store.has("bounded:unknown"), true);
  });

  test("rechaza JSON inválido y cuerpos demasiado grandes", async () => {
    await assert.rejects(
      readLimitedJson(
        new Request("https://example.test/api/contact", {
          method: "POST",
          body: "{contenido inválido",
        }),
      ),
      (error: unknown) =>
        error instanceof ContactRequestError && error.status === 400,
    );

    await assert.rejects(
      readLimitedJson(
        new Request("https://example.test/api/contact", {
          method: "POST",
          headers: { "content-length": String(20 * 1024) },
          body: "{}",
        }),
      ),
      (error: unknown) =>
        error instanceof ContactRequestError && error.status === 413,
    );
  });

  test("usa un destinatario explícito sin alterar el remitente", () => {
    process.env.EMAIL_USER = "remitente@example.com";
    process.env.CONTACT_EMAIL = "destino@example.com";

    assert.deepEqual(getMailAddresses(), {
      sender: "remitente@example.com",
      recipient: "destino@example.com",
    });
  });

  test("limita esperas SMTP sin activar reenvíos automáticos", () => {
    const previous = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      connection: process.env.SMTP_CONNECTION_TIMEOUT_MS,
      greeting: process.env.SMTP_GREETING_TIMEOUT_MS,
      socket: process.env.SMTP_SOCKET_TIMEOUT_MS,
    };
    process.env.EMAIL_USER = "remitente@example.com";
    process.env.EMAIL_PASS = "clave-de-prueba";
    process.env.SMTP_CONNECTION_TIMEOUT_MS = "2500";
    process.env.SMTP_GREETING_TIMEOUT_MS = "3000";
    process.env.SMTP_SOCKET_TIMEOUT_MS = "4500";

    try {
      const transport = createMailTransport() as unknown as {
        close: () => void;
        options: Record<string, unknown>;
      };
      assert.equal(transport.options.connectionTimeout, 2500);
      assert.equal(transport.options.greetingTimeout, 3000);
      assert.equal(transport.options.socketTimeout, 4500);
      assert.equal(transport.options.disableFileAccess, true);
      assert.equal(transport.options.disableUrlAccess, true);
      assert.equal("maxConnections" in transport.options, false);
      transport.close();
    } finally {
      for (const [name, value] of Object.entries({
        EMAIL_USER: previous.user,
        EMAIL_PASS: previous.pass,
        SMTP_CONNECTION_TIMEOUT_MS: previous.connection,
        SMTP_GREETING_TIMEOUT_MS: previous.greeting,
        SMTP_SOCKET_TIMEOUT_MS: previous.socket,
      })) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
