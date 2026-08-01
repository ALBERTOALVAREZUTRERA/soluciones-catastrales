"""Cliente mínimo para los servicios WCF/REST libres de Catastro."""

from __future__ import annotations

import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Iterable, Optional

from core.resilient_http import open_url_with_retry


CALLEJERO_URL = (
    "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/"
    "COVCCallejero.svc/rest"
)
COORDENADAS_URL = (
    "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/"
    "COVCCoordenadas.svc/rest"
)
MAX_RESPONSE_BYTES = 2 * 1024 * 1024
REQUEST_TIMEOUT_SECONDS = 15
USER_AGENT = "SolucionesCatastrales/1.0"


class CatastroClientError(Exception):
    """Error controlado al validar, consultar o interpretar Catastro."""


class CatastroUpstreamError(CatastroClientError):
    """El servicio remoto no pudo proporcionar una respuesta utilizable."""


def normalize_cadastral_reference(value: str) -> str:
    """Admite referencias de finca (14) o inmueble (18/20), sin espacios."""
    normalized = re.sub(r"\s+", "", str(value or "")).upper()
    if len(normalized) not in (14, 18, 20) or not re.fullmatch(
        r"[A-Z0-9]+",
        normalized,
    ):
        raise ValueError(
            "La referencia catastral debe tener 14, 18 o 20 caracteres alfanuméricos"
        )
    return normalized


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def elements(root: ET.Element, name: str) -> Iterable[ET.Element]:
    return (node for node in root.iter() if local_name(node.tag) == name)


def first_element(root: Optional[ET.Element], name: str) -> Optional[ET.Element]:
    if root is None:
        return None
    return next(elements(root, name), None)


def first_text(root: Optional[ET.Element], name: str, default: str = "") -> str:
    node = first_element(root, name)
    return (node.text or "").strip() if node is not None else default


def child(root: Optional[ET.Element], name: str) -> Optional[ET.Element]:
    if root is None:
        return None
    return next(
        (node for node in list(root) if local_name(node.tag) == name),
        None,
    )


def child_text(root: Optional[ET.Element], name: str, default: str = "") -> str:
    node = child(root, name)
    return (node.text or "").strip() if node is not None else default


def catastro_error(root: ET.Element) -> Optional[str]:
    error = first_element(root, "err")
    if error is not None:
        code = child_text(error, "cod", "0")
        description = child_text(error, "des", "Error no especificado")
        if code != "0":
            return description
    try:
        if int(first_text(root, "cuerr", "0")) > 0:
            return first_text(root, "des", "Error no especificado")
    except ValueError:
        return "Respuesta de error no válida"
    return None


def cadastral_reference_from(root: ET.Element, full: bool = False) -> str:
    rc_node = first_element(root, "rc")
    if rc_node is None:
        rc_node = first_element(root, "pc")
    if rc_node is None:
        return ""
    base = child_text(rc_node, "pc1") + child_text(rc_node, "pc2")
    if not full:
        return base
    return (
        base
        + child_text(rc_node, "car")
        + child_text(rc_node, "cc1")
        + child_text(rc_node, "cc2")
    )


def _request_xml(base_url: str, method: str, params: dict[str, object]) -> ET.Element:
    query = urllib.parse.urlencode(
        {key: str(value) for key, value in params.items()},
        quote_via=urllib.parse.quote,
    )
    url = f"{base_url}/{method}?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/xml",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with open_url_with_retry(
            request,
            context=ssl.create_default_context(),
            timeout=REQUEST_TIMEOUT_SECONDS,
            service="catastro_wcf",
        ) as response:
            payload = response.read(MAX_RESPONSE_BYTES + 1)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        raise CatastroUpstreamError(
            "El servicio del Catastro no está disponible temporalmente"
        ) from exc

    if len(payload) > MAX_RESPONSE_BYTES:
        raise CatastroUpstreamError("La respuesta del Catastro supera el límite admitido")
    try:
        return ET.fromstring(payload)
    except ET.ParseError as exc:
        raise CatastroUpstreamError(
            "El servicio del Catastro devolvió una respuesta no válida"
        ) from exc


def get_property(reference: str) -> ET.Element:
    return _request_xml(
        CALLEJERO_URL,
        "Consulta_DNPRC",
        {"RefCat": reference},
    )


def get_rustic_property(
    province: str,
    municipality: str,
    polygon: str,
    parcel: str,
) -> ET.Element:
    return _request_xml(
        CALLEJERO_URL,
        "Consulta_DNPPP",
        {
            "Provincia": province,
            "Municipio": municipality,
            "Poligono": polygon,
            "Parcela": parcel,
        },
    )


def get_coordinates(reference: str) -> ET.Element:
    return _request_xml(
        COORDENADAS_URL,
        "Consulta_CPMRC",
        {
            "Provincia": "",
            "Municipio": "",
            "SRS": "EPSG:4326",
            "RefCat": reference[:14],
        },
    )


def get_reference_by_coordinates(latitude: float, longitude: float) -> ET.Element:
    return _request_xml(
        COORDENADAS_URL,
        "Consulta_RCCOOR",
        {
            "SRS": "EPSG:4326",
            "CoorX": longitude,
            "CoorY": latitude,
        },
    )
