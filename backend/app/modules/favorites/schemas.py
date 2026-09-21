"""
=====================================================================
ARIX BACKEND - Módulo Favorites: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.products.schemas import ProductSummaryResponse


class FavoriteResponse(BaseModel):
    """Representación de un producto favorito del cliente."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product: ProductSummaryResponse
    created_at: datetime


class AddFavoriteRequest(BaseModel):
    """Agregar un producto a favoritos."""

    product_id: int
