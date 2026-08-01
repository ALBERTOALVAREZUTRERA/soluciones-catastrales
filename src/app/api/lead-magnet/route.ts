import {
  checkRateLimit,
  ContactRequestError,
  createMailTransport,
  escapeHtml,
  getMailAddresses,
  isHoneypotFilled,
  leadMagnetRequestSchema,
  rateLimitHeaders,
  readLimitedJson,
} from "@/lib/contact-server";
import {
  apiError,
  apiJson,
  getRequestId,
  logApiError,
} from "@/lib/api-observability";

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const rateLimit = checkRateLimit(req, "lead-magnet");
  const quotaHeaders = rateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return apiError(
      "Demasiados intentos. Espere unos minutos antes de volver a enviar.",
      "rate_limited",
      429,
      requestId,
      {
        headers: quotaHeaders,
      },
    );
  }

  try {
    const rawBody = await readLimitedJson(req);
    if (isHoneypotFilled(rawBody)) {
      return apiJson({ success: true }, requestId, { headers: quotaHeaders });
    }

    const parsed = leadMagnetRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(
        "Revise los datos del formulario.",
        "validation_error",
        400,
        requestId,
        { headers: quotaHeaders },
        { fields: parsed.error.flatten().fieldErrors },
      );
    }

    const { name, contact } = parsed.data;

    if (
      process.env.NODE_ENV !== "production" &&
      (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
    ) {
      return apiJson(
        { success: true, mocked: true },
        requestId,
        { headers: quotaHeaders },
      );
    }

    const transporter = createMailTransport();
    const { sender, recipient } = getMailAddresses();
    const safeName = escapeHtml(name);
    const safeContact = escapeHtml(contact);
    const subjectName = name.replace(/[\r\n]/g, " ");

    await transporter.sendMail({
      from: `LEAD MAGNET WEB <${sender}>`,
      to: recipient,
      subject: `NUEVO LEAD: Descarga Guía Catastral - ${subjectName}`,
      text: [
        "Nueva solicitud de descarga de la guía catastral.",
        "",
        `Nombre: ${name}`,
        `Teléfono / email: ${contact}`,
      ].join("\n"),
      html: `
        <h2>Nueva solicitud de la guía catastral</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Teléfono o email:</strong> ${safeContact}</p>
      `,
    });

    return apiJson({ success: true }, requestId, { headers: quotaHeaders });
  } catch (error) {
    if (error instanceof ContactRequestError) {
      return apiError(
        error.message,
        error.status === 413 ? "payload_too_large" : "invalid_request",
        error.status,
        requestId,
        { headers: quotaHeaders },
      );
    }

    logApiError("lead_magnet_submission_failed", requestId, error);
    return apiError(
      "No se pudo procesar la solicitud. Inténtelo de nuevo.",
      "internal_error",
      500,
      requestId,
      { headers: quotaHeaders },
    );
  }
}
