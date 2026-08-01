import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";
import { join } from "node:path";

const root = process.cwd();
const readSource = (path: string) => readFileSync(join(root, path), "utf8");

describe("preparación para producción", () => {
  test("documenta todas las variables obligatorias", () => {
    const example = readSource(".env.example");
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

    for (const key of required) {
      assert.match(example, new RegExp(`^${key}=`, "m"), key);
    }
  });

  test("la validación acepta una configuración de producción completa", () => {
    const result = spawnSync(process.execPath, ["scripts/validate-env.mjs"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://www.solucionescatastrales.app",
        NEXT_PUBLIC_BACKEND_URL: "https://api.solucionescatastrales.app",
        SMTP_HOST: "smtp.servidor.es",
        SMTP_PORT: "465",
        EMAIL_USER: "formularios@solucionescatastrales.app",
        EMAIL_PASS: "una-clave-segura",
        CONTACT_EMAIL: "contacto@solucionescatastrales.app",
        LEGAL_TAX_ID: "12345678Z",
        LEGAL_PROFESSIONAL_BODY: "Colegio profesional configurado",
        LEGAL_REGISTRATION_NUMBER: "1234",
        APP_ENV: "production",
        ADMITTED_ORIGINS: "https://www.solucionescatastrales.app",
        MAX_UPLOAD_BYTES: "26214400",
        MAX_ARCHIVE_UNCOMPRESSED_BYTES: "104857600",
        MAX_ARCHIVE_MEMBERS: "200",
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuración de producción validada/);
    assert.doesNotMatch(result.stdout, /una-clave-segura/);
  });

  test("no conserva la configuración Firestore eliminada", () => {
    assert.equal(existsSync(join(root, "backend.json")), false);
    assert.equal(existsSync(join(root, "docs/backend.json")), false);
    assert.doesNotMatch(readSource("next.config.ts"), /firebaseio/);
  });

  test("el aviso legal obtiene la identidad desde configuración", () => {
    const legalPage = readSource("src/app/legal/aviso-legal/page.tsx");
    assert.match(legalPage, /LEGAL_IDENTITY\.taxId/);
    assert.match(legalPage, /LEGAL_IDENTITY\.professionalBody/);
    assert.match(legalPage, /LEGAL_IDENTITY\.registrationNumber/);
  });
});
