"""
=====================================================================
ARIX BACKEND - Módulo Categories: Schemas Pydantic
=====================================================================
"""

from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    """Representación de una categoría, incluyendo subcategorías."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    parent_id: int | None
    children: list["CategoryResponse"] = []


class CreateCategoryRequest(BaseModel):
    """Creación de una categoría (Super Admin)."""

    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    description: str | None = Field(default=None, max_length=255)
    parent_id: int | None = None


class UpdateCategoryRequest(BaseModel):
    """Actualización de una categoría (Super Admin)."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    parent_id: int | None = None


CategoryResponse.model_rebuild()
