"""
=====================================================================
ARIX BACKEND - Respuesta estándar de la API
=====================================================================
Envoltorio genérico usado en todas las respuestas de la API ARIX,
para mantener un formato consistente en éxito y error.
=====================================================================
"""

from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Envoltorio estándar de respuesta para los endpoints de la API ARIX."""

    success: bool
    message: str
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def ok(cls, data: T = None, message: str = "OK") -> "ApiResponse[T]":
        return cls(success=True, message=message, data=data)

    @classmethod
    def fail(cls, message: str) -> "ApiResponse[T]":
        return cls(success=False, message=message, data=None)
