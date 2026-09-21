"""
=====================================================================
ARIX BACKEND - Respuesta paginada
=====================================================================
Envoltorio genérico para resultados paginados (listados de productos,
órdenes, usuarios, etc.).
=====================================================================
"""

import math
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageParams(BaseModel):
    """Parámetros de paginación recibidos en query params."""

    page: int = 1       # 1-indexed para el usuario
    size: int = 10

    @property
    def offset(self) -> int:
        return max(self.page - 1, 0) * self.size

    @property
    def limit(self) -> int:
        return self.size


class PageResponse(BaseModel, Generic[T]):
    """Envoltorio estándar para respuestas paginadas."""

    content: List[T]
    page_number: int
    page_size: int
    total_elements: int
    total_pages: int
    last: bool

    @classmethod
    def create(cls, content: List[T], total_elements: int, params: PageParams) -> "PageResponse[T]":
        total_pages = math.ceil(total_elements / params.size) if params.size else 0
        return cls(
            content=content,
            page_number=params.page,
            page_size=params.size,
            total_elements=total_elements,
            total_pages=total_pages,
            last=params.page >= total_pages,
        )
