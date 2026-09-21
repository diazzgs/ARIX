"""
=====================================================================
ARIX BACKEND - Manejadores globales de excepciones
=====================================================================
Registra los handlers que capturan las excepciones de negocio
(AppException y subclases) y las excepciones de validación de
Pydantic/FastAPI, devolviendo siempre el formato ApiResponse.
=====================================================================
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.common.exceptions.custom_exceptions import AppException
from app.common.schemas.response import ApiResponse

logger = logging.getLogger("arix")


def register_exception_handlers(app: FastAPI) -> None:
    """Registra todos los manejadores de excepciones en la app FastAPI."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse.fail(exc.message).model_dump(mode="json"),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error.get("loc", []) if loc != "body")
            errors.append(f"{field}: {error.get('msg')}")
        message = "Error de validación: " + "; ".join(errors)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ApiResponse.fail(message).model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Error no controlado: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse.fail("Error interno del servidor").model_dump(mode="json"),
        )
