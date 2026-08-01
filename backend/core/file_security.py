"""Controles de seguridad para archivos subidos y comprimidos."""

from __future__ import annotations

import os
import shutil
import stat
import zipfile
from pathlib import Path
from typing import BinaryIO


DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024
DEFAULT_MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
DEFAULT_MAX_ARCHIVE_MEMBERS = 200
DEFAULT_MAX_COMPRESSION_RATIO = 200
COPY_CHUNK_BYTES = 1024 * 1024


class FileSecurityError(ValueError):
    """El archivo no cumple los límites o controles de seguridad."""


class UploadTooLargeError(FileSecurityError):
    """La subida supera el tamaño máximo permitido."""


def _positive_env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if not raw_value:
        return default

    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} debe ser un número entero positivo") from exc

    if value <= 0:
        raise RuntimeError(f"{name} debe ser un número entero positivo")
    return value


def get_max_upload_bytes() -> int:
    return _positive_env_int("MAX_UPLOAD_BYTES", DEFAULT_MAX_UPLOAD_BYTES)


async def save_upload_limited(
    upload,
    destination: BinaryIO,
    max_bytes: int | None = None,
) -> int:
    """Copia una subida por bloques y detiene la lectura al superar el límite."""

    limit = max_bytes or get_max_upload_bytes()
    total_bytes = 0

    while chunk := await upload.read(COPY_CHUNK_BYTES):
        total_bytes += len(chunk)
        if total_bytes > limit:
            raise UploadTooLargeError(
                f"El archivo supera el límite de {limit // (1024 * 1024)} MB"
            )
        destination.write(chunk)

    if total_bytes == 0:
        raise FileSecurityError("El archivo está vacío")

    return total_bytes


def _is_symlink(member: zipfile.ZipInfo) -> bool:
    unix_mode = member.external_attr >> 16
    return stat.S_ISLNK(unix_mode)


def _safe_member_target(destination: Path, member_name: str) -> Path:
    normalized_name = member_name.replace("\\", "/")
    member_path = Path(normalized_name)

    if member_path.is_absolute() or ".." in member_path.parts:
        raise FileSecurityError(
            f"El archivo comprimido contiene una ruta no permitida: {member_name}"
        )

    target = (destination / member_path).resolve()
    try:
        target.relative_to(destination)
    except ValueError as exc:
        raise FileSecurityError(
            f"El archivo comprimido intenta escribir fuera del directorio temporal: {member_name}"
        ) from exc

    return target


def safe_extract_zip(
    archive_path: str,
    destination: str,
    *,
    max_members: int | None = None,
    max_uncompressed_bytes: int | None = None,
    max_compression_ratio: int = DEFAULT_MAX_COMPRESSION_RATIO,
) -> list[str]:
    """Extrae un ZIP/KMZ validando rutas, tamaño, enlaces y compresión."""

    member_limit = max_members or _positive_env_int(
        "MAX_ARCHIVE_MEMBERS", DEFAULT_MAX_ARCHIVE_MEMBERS
    )
    size_limit = max_uncompressed_bytes or _positive_env_int(
        "MAX_ARCHIVE_UNCOMPRESSED_BYTES", DEFAULT_MAX_ARCHIVE_BYTES
    )
    destination_path = Path(destination).resolve()
    destination_path.mkdir(parents=True, exist_ok=True)

    extracted_paths: list[str] = []

    try:
        archive = zipfile.ZipFile(archive_path, "r")
    except (zipfile.BadZipFile, OSError) as exc:
        raise FileSecurityError("El archivo ZIP/KMZ no es válido") from exc

    with archive:
        members = archive.infolist()
        if len(members) > member_limit:
            raise FileSecurityError(
                f"El archivo comprimido contiene más de {member_limit} elementos"
            )

        total_uncompressed = 0
        validated_members: list[tuple[zipfile.ZipInfo, Path]] = []

        for member in members:
            if member.flag_bits & 0x1:
                raise FileSecurityError("No se admiten archivos ZIP/KMZ cifrados")
            if _is_symlink(member):
                raise FileSecurityError("No se admiten enlaces simbólicos en ZIP/KMZ")

            target = _safe_member_target(destination_path, member.filename)
            total_uncompressed += member.file_size
            if total_uncompressed > size_limit:
                raise FileSecurityError(
                    "El contenido descomprimido supera el límite permitido"
                )

            if (
                member.file_size > 0
                and member.compress_size == 0
                or (
                    member.compress_size > 0
                    and member.file_size / member.compress_size > max_compression_ratio
                )
            ):
                raise FileSecurityError(
                    f"El archivo {member.filename} tiene una compresión sospechosa"
                )

            validated_members.append((member, target))

        for member, target in validated_members:
            if member.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue

            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member, "r") as source, target.open("wb") as output:
                shutil.copyfileobj(source, output, COPY_CHUNK_BYTES)
            extracted_paths.append(str(target))

    return extracted_paths
