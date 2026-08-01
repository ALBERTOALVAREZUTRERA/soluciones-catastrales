import nodemailer from "nodemailer";
import { isIP } from "node:net";
import { z } from "zod";

const MAX_REQUEST_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MAX_ENTRIES = 10_000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  retryAfterSeconds: number;
};

declare global {
  // eslint-disable-next-line no-var
  var contactRateLimitStore: Map<string, RateLimitEntry> | undefined;
  // eslint-disable-next-line no-var
  var contactRateLimitLastCleanup: number | undefined;
}

const rateLimitStore =
  globalThis.contactRateLimitStore ??
  (globalThis.contactRateLimitStore = new Map<string, RateLimitEntry>());

const optionalEmail = z.union([
  z.string().trim().email("El email no es válido").max(254),
  z.literal(""),
]);

export const contactRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: optionalEmail.default(""),
    phone: z.string().trim().max(30).default(""),
    type: z.string().trim().min(2).max(120),
    ref: z
      .string()
      .trim()
      .max(20)
      .regex(/^[A-Za-z0-9]*$/, "La referencia catastral no es válida")
      .default(""),
    message: z.string().trim().min(5).max(4_000),
    privacyAccepted: z.literal(true),
    website: z.string().max(200).default(""),
  })
  .strict()
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Debe indicar un email o teléfono de contacto",
    path: ["email"],
  });

export const leadMagnetRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    contact: z.string().trim().min(5).max(254),
    privacyAccepted: z.literal(true),
    website: z.string().max(200).default(""),
  })
  .strict();

export class ContactRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function readLimitedJson(req: Request): Promise<unknown> {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new ContactRequestError("La solicitud es demasiado grande.", 413);
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    throw new ContactRequestError("La solicitud es demasiado grande.", 413);
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new ContactRequestError("El contenido enviado no es válido.", 400);
  }
}

export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === "string" && website.trim().length > 0;
}

export function checkRateLimit(
  req: Request,
  bucket: string,
): RateLimitResult {
  const now = Date.now();
  const lastCleanup = globalThis.contactRateLimitLastCleanup || 0;
  if (now - lastCleanup >= RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(key);
    }
    globalThis.contactRateLimitLastCleanup = now;
  }

  const forwardedFor = req.headers.get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const clientIp = [forwardedFor, realIp].find((value) => value && isIP(value))
    || "unknown";
  const key = `${bucket}:${clientIp}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    if (!current && rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey) rateLimitStore.delete(oldestKey);
    }
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      retryAfterSeconds: 0,
    };
  }

  const resetAfterSeconds = Math.max(
    1,
    Math.ceil((current.resetAt - now) / 1000),
  );
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      resetAfterSeconds,
      retryAfterSeconds: resetAfterSeconds,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    resetAfterSeconds,
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetAfterSeconds),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character,
  );
}

export function createMailTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new ContactRequestError(
      "El servicio de correo no está configurado.",
      503,
    );
  }

  const port = Number(process.env.SMTP_PORT) || 465;
  const connectionTimeout = boundedMilliseconds(
    process.env.SMTP_CONNECTION_TIMEOUT_MS,
    10_000,
  );
  const greetingTimeout = boundedMilliseconds(
    process.env.SMTP_GREETING_TIMEOUT_MS,
    10_000,
  );
  const socketTimeout = boundedMilliseconds(
    process.env.SMTP_SOCKET_TIMEOUT_MS,
    30_000,
  );
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

function boundedMilliseconds(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1_000 && parsed <= 120_000
    ? parsed
    : fallback;
}

export function getMailAddresses() {
  const sender = process.env.EMAIL_USER;
  if (!sender) {
    throw new ContactRequestError(
      "El servicio de correo no está configurado.",
      503,
    );
  }

  return {
    sender,
    recipient: process.env.CONTACT_EMAIL || sender,
  };
}
