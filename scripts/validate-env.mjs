import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

process.on("uncaughtException", (error) => {
  console.error(error instanceof Error ? error.message : "Configuración no válida");
  process.exit(1);
});

const files = [".env", ".env.local"];

for (const file of files) {
  const path = resolve(file);
  if (!existsSync(path)) continue;

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BACKEND_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "CONTACT_EMAIL",
  "LEGAL_TAX_ID",
  "LEGAL_PROFESSIONAL_BODY",
  "LEGAL_REGISTRATION_NUMBER",
  "APP_ENV",
  "ADMITTED_ORIGINS",
  "MAX_UPLOAD_BYTES",
  "MAX_ARCHIVE_UNCOMPRESSED_BYTES",
  "MAX_ARCHIVE_MEMBERS",
];

const missing = required.filter((key) => !process.env[key]?.trim());
assert.equal(
  missing.length,
  0,
  `Faltan variables obligatorias: ${missing.join(", ")}`,
);

const placeholders = /example\.com|00000000X|clave-de-aplicacion|nombre del colegio/i;
const unresolved = required.filter((key) => placeholders.test(process.env[key] || ""));
assert.equal(
  unresolved.length,
  0,
  `Hay valores de ejemplo sin sustituir: ${unresolved.join(", ")}`,
);

for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BACKEND_URL"]) {
  const url = new URL(process.env[key]);
  assert.equal(url.protocol, "https:", `${key} debe usar HTTPS`);
}

for (const key of ["EMAIL_USER", "CONTACT_EMAIL"]) {
  assert.match(process.env[key], /^[^\s@]+@[^\s@]+\.[^\s@]+$/, `${key} no es válido`);
}

const smtpPort = Number(process.env.SMTP_PORT);
assert.ok(
  Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort <= 65535,
  "SMTP_PORT no es válido",
);

for (const key of [
  "SMTP_CONNECTION_TIMEOUT_MS",
  "SMTP_GREETING_TIMEOUT_MS",
  "SMTP_SOCKET_TIMEOUT_MS",
]) {
  if (!process.env[key]?.trim()) continue;
  const value = Number(process.env[key]);
  assert.ok(
    Number.isInteger(value) && value >= 1_000 && value <= 120_000,
    `${key} debe estar entre 1000 y 120000 milisegundos`,
  );
}

for (const [key, minimum, maximum] of [
  ["MAX_JSON_REQUEST_BYTES", 1_024, 64 * 1024 * 1024],
  ["MAX_CONCURRENT_GIS_JOBS", 1, 32],
  ["GIS_QUEUE_TIMEOUT_MS", 100, 30_000],
]) {
  if (!process.env[key]?.trim()) continue;
  const value = Number(process.env[key]);
  assert.ok(
    Number.isInteger(value) && value >= minimum && value <= maximum,
    `${key} debe ser un entero entre ${minimum} y ${maximum}`,
  );
}

assert.equal(
  process.env.APP_ENV.trim().toLowerCase(),
  "production",
  "APP_ENV debe ser production",
);

for (const key of [
  "MAX_UPLOAD_BYTES",
  "MAX_ARCHIVE_UNCOMPRESSED_BYTES",
  "MAX_ARCHIVE_MEMBERS",
]) {
  const value = Number(process.env[key]);
  assert.ok(Number.isInteger(value) && value > 0, `${key} debe ser un entero positivo`);
}

const origins = process.env.ADMITTED_ORIGINS.split(",").map((value) => value.trim());
assert.ok(!origins.includes("*"), "ADMITTED_ORIGINS no puede contener *");
for (const origin of origins) {
  const url = new URL(origin);
  assert.equal(url.protocol, "https:", "Los orígenes de producción deben usar HTTPS");
}

console.log("Configuración de producción validada sin mostrar valores sensibles.");
