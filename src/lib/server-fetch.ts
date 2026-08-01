type NextFetchInit = RequestInit & {
  next?: { revalidate?: number };
};

type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  requestId: string;
  service: string;
  timeoutMs?: number;
};

const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchWithRetry(
  input: string | URL,
  init: NextFetchInit,
  options: RetryOptions,
): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const attempts = options.attempts ?? 2;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const baseDelayMs = options.baseDelayMs ?? 150;

  if (!['GET', 'HEAD'].includes(method)) {
    throw new Error("Solo se permiten reintentos de consultas idempotentes");
  }
  if (attempts < 1 || attempts > 3) {
    throw new Error("attempts debe estar entre 1 y 3");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const signal = init.signal
      ? AbortSignal.any([init.signal, controller.signal])
      : controller.signal;

    try {
      const response = await fetch(input, { ...init, signal });
      if (!TRANSIENT_STATUS.has(response.status) || attempt === attempts) {
        return response;
      }
      await response.body?.cancel().catch(() => undefined);
      lastError = new Error(`HTTP_${response.status}`);
    } catch (error) {
      if (init.signal?.aborted || attempt === attempts) throw error;
      lastError = error;
    } finally {
      clearTimeout(timer);
    }

    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "upstream_retry",
      service: options.service,
      requestId: options.requestId,
      attempt: attempt + 1,
      errorType: lastError instanceof Error ? lastError.name : "UnknownError",
    }));
    if (baseDelayMs > 0) await delay(baseDelayMs * (2 ** (attempt - 1)));
  }

  throw lastError;
}
