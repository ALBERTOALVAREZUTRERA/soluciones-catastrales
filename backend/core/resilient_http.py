"""Utilidades HTTP limitadas para consultas externas idempotentes."""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any, Callable


TRANSIENT_HTTP_STATUS = {429, 500, 502, 503, 504}
logger = logging.getLogger("catastro.upstream")


def open_url_with_retry(
    request: urllib.request.Request,
    *,
    context: Any,
    timeout: float,
    service: str,
    attempts: int = 2,
    base_delay_seconds: float = 0.2,
    opener: Callable[..., Any] | None = None,
    sleeper: Callable[[float], None] = time.sleep,
):
    """Abre un GET y reintenta una vez solo ante fallos transitorios."""
    if attempts < 1 or attempts > 3:
        raise ValueError("attempts debe estar entre 1 y 3")
    if request.get_method().upper() != "GET":
        raise ValueError("Solo se permiten reintentos de consultas GET")

    open_request = opener or urllib.request.urlopen
    for attempt in range(1, attempts + 1):
        try:
            return open_request(request, context=context, timeout=timeout)
        except urllib.error.HTTPError as exc:
            retryable = exc.code in TRANSIENT_HTTP_STATUS
            if not retryable or attempt >= attempts:
                raise
            exc.close()
            error_type = f"HTTP_{exc.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            if attempt >= attempts:
                raise
            error_type = type(exc).__name__

        logger.warning(json.dumps({
            "event": "upstream_retry",
            "service": service,
            "attempt": attempt + 1,
            "errorType": error_type,
        }, separators=(",", ":")))
        sleeper(base_delay_seconds * (2 ** (attempt - 1)))

    raise RuntimeError("No se pudo completar la consulta externa")
