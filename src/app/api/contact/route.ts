import {
  checkRateLimit,
  ContactRequestError,
  contactRequestSchema,
  createMailTransport,
  escapeHtml,
  getMailAddresses,
  isHoneypotFilled,
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
  const rateLimit = checkRateLimit(req, "contact");
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

    const parsed = contactRequestSchema.safeParse(rawBody);
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

    const { name, email, phone, type, ref, message } = parsed.data;

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
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeType = escapeHtml(type);
    const safeRef = escapeHtml(ref || "No especificada");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const subjectType = type.replace(/[\r\n]/g, " ");
    const subjectName = name.replace(/[\r\n]/g, " ");

    await transporter.sendMail({
      from: `CATASTRO WEB <${sender}>`,
      to: recipient,
      ...(email ? { replyTo: email } : {}),
      subject: `NUEVO EXPEDIENTE WEB: ${subjectType.toUpperCase()} - ${subjectName}`,
      text: [
        "Has recibido un nuevo contacto desde la web:",
        "",
        `Nombre: ${name}`,
        `Email: ${email || "No indicado"}`,
        `Teléfono: ${phone || "No indicado"}`,
        `Tipo de trámite: ${type}`,
        `Referencia catastral: ${ref || "No especificada"}`,
        "",
        "Mensaje:",
        message,
      ].join("\n"),
      html: `
        <h2>Nuevo expediente web recibido</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail || "No indicado"}</p>
        <p><strong>Teléfono:</strong> ${safePhone || "No indicado"}</p>
        <p><strong>Tipo de trámite:</strong> ${safeType}</p>
        <p><strong>Referencia catastral:</strong> ${safeRef}</p>
        <hr />
        <h3>Mensaje / descripción del caso:</h3>
        <p>${safeMessage}</p>
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

    logApiError("contact_submission_failed", requestId, error);
    return apiError(
      "No se pudo enviar la solicitud. Inténtelo de nuevo o contacte por teléfono.",
      "internal_error",
      500,
      requestId,
      { headers: quotaHeaders },
    );
  }
}
