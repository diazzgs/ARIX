"""
=====================================================================
ARIX BACKEND - Excepciones personalizadas
=====================================================================
Excepciones de negocio usadas en los servicios. Son capturadas por
los handlers globales registrados en main.py para devolver respuestas
HTTP consistentes (ver app/common/exceptions/handlers.py).
=====================================================================
"""


class AppException(Exception):
    """Excepción base de la aplicación ARIX."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ResourceNotFoundException(AppException):
    """Recurso no encontrado (HTTP 404)."""

    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message, status_code=404)


class BadRequestException(AppException):
    """Solicitud inválida (HTTP 400)."""

    def __init__(self, message: str = "Solicitud inválida"):
        super().__init__(message, status_code=400)


class UnauthorizedException(AppException):
    """No autenticado (HTTP 401)."""

    def __init__(self, message: str = "No autorizado"):
        super().__init__(message, status_code=401)


class ForbiddenException(AppException):
    """Sin permisos suficientes (HTTP 403)."""

    def __init__(self, message: str = "Acceso denegado"):
        super().__init__(message, status_code=403)


class ConflictException(AppException):
    """Conflicto con el estado actual del recurso (HTTP 409)."""

    def __init__(self, message: str = "Conflicto con el estado actual del recurso"):
        super().__init__(message, status_code=409)
