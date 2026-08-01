import assert from "node:assert/strict";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Validación estricta omitida fuera del despliegue de producción.");
  process.exit(0);
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
];

const missing = required.filter((key) => !process.env[key]?.trim());
assert.equal(
  missing.length,
  0,
  `Despliegue bloqueado: faltan variables de producción: ${missing.join(", ")}`,
);

const placeholders = /example\.com|00000000X|clave-de-aplicacion|nombre del colegio/i;
const unresolved = required.filter((key) => placeholders.test(process.env[key] || ""));
assert.equal(
  unresolved.length,
  0,
  `Despliegue bloqueado: hay valores de ejemplo en: ${unresolved.join(", ")}`,
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

console.log("Variables del despliegue frontend validadas sin mostrar valores sensibles.");
