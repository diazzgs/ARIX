"""
=====================================================================
ARIX BACKEND - Módulo Reviews: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums.statuses import ReviewStatus


class ReviewCustomerSummary(BaseModel):
    """Resumen del cliente que escribió la reseña."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    profile_image_url: str


class ReviewResponse(BaseModel):
    """Representación de una reseña de producto."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    rating: int
    comment: str | None
    status: ReviewStatus
    customer: ReviewCustomerSummary
    created_at: datetime


class CreateReviewRequest(BaseModel):
    """Creación de una reseña por el cliente (debe haber comprado el producto)."""

    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class UpdateReviewRequest(BaseModel):
    """Edición de una reseña propia."""

    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ModerateReviewRequest(BaseModel):
    """Moderación de una reseña por el Super Admin."""

    status: ReviewStatus
