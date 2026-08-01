import { NextResponse } from "next/server";

export const REQUEST_ID_HEADER = "X-Request-ID";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,100}$/;

export function getRequestId(request: Request): string {
  const candidate = request.headers.get(REQUEST_ID_HEADER)?.trim() || "";
  return REQUEST_ID_PATTERN.test(candidate) ? candidate : crypto.randomUUID();
}

export function apiJson<T>(
  body: T,
  requestId: string,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return NextResponse.json(body, { ...init, headers });
}

export function apiError(
  message: string,
  code: string,
  status: number,
  requestId: string,
  init: Omit<ResponseInit, "status"> = {},
  extra: Record<string, unknown> = {},
) {
  const headers = new Headers(init.headers);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  return apiJson(
    { error: message, code, requestId, ...extra },
    requestId,
    { ...init, status, headers },
  );
}

export function logApiError(
  event: string,
  requestId: string,
  error: unknown,
) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      event,
      requestId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    }),
  );
}
