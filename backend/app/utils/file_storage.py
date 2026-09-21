"""
=====================================================================
ARIX BACKEND - Utilidades: Almacenamiento de archivos
=====================================================================
Funciones para guardar archivos subidos (imágenes de avatar, logos,
banners y productos) en el sistema de archivos local, dentro de
UPLOAD_DIR, y construir la URL pública servida por /api/files.

Estructura de carpetas resultante:
    uploads/
        avatars/<uuid>.<ext>
        stores/<uuid>.<ext>
        products/<uuid>.<ext>
        invoices/<archivo>.pdf
=====================================================================
"""

import uuid
from pathlib import Path

from fastapi import UploadFile

from app.common.exceptions.custom_exceptions import BadRequestException
from app.core.config import settings

# Extensiones de imagen permitidas
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Subcarpetas válidas dentro de UPLOAD_DIR
SUBFOLDER_AVATARS = "avatars"
SUBFOLDER_STORES = "stores"
SUBFOLDER_PRODUCTS = "products"
SUBFOLDER_INVOICES = "invoices"


def _validate_image(file: UploadFile) -> str:
    """Valida que el archivo sea una imagen permitida y retorna su extensión."""
    if file.filename is None:
        raise BadRequestException("El archivo no tiene nombre")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        raise BadRequestException(f"Tipo de archivo no permitido. Extensiones válidas: {allowed}")

    return extension


def save_image(file: UploadFile, subfolder: str) -> str:
    """
    Guarda una imagen subida dentro de UPLOAD_DIR/<subfolder>/ con un
    nombre único (UUID) y retorna la URL pública para acceder a ella.

    La URL retornada tiene el formato:
        /api/files/<subfolder>/<uuid>.<ext>

    y es servida directamente por el StaticFiles montado en main.py.
    """
    extension = _validate_image(file)

    target_dir = Path(settings.UPLOAD_DIR) / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    target_path = target_dir / filename

    with target_path.open("wb") as buffer:
        content = file.file.read()
        buffer.write(content)

    # Validar tamaño máximo después de escribir (más simple para UploadFile)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if target_path.stat().st_size > max_bytes:
        target_path.unlink(missing_ok=True)
        raise BadRequestException(f"El archivo excede el tamaño máximo permitido ({settings.MAX_UPLOAD_SIZE_MB}MB)")

    return f"/api/files/{subfolder}/{filename}"


def delete_file_by_url(file_url: str) -> None:
    """
    Elimina un archivo físico a partir de su URL pública (/api/files/...).

    No lanza error si el archivo no existe (operación idempotente);
    ignora URLs que no correspondan a archivos locales (ej. URLs externas
    usadas como imágenes por defecto o de prueba).
    """
    prefix = "/api/files/"
    if not file_url.startswith(prefix):
        return

    relative_path = file_url[len(prefix):]
    target_path = Path(settings.UPLOAD_DIR) / relative_path

    target_path.unlink(missing_ok=True)
