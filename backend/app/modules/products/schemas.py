"""
=====================================================================
ARIX BACKEND - Módulo Products: Schemas Pydantic
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums.statuses import ProductStatus
from app.modules.inventory.schemas import InventoryResponse


# =====================================================================
# IMÁGENES
# =====================================================================

class ProductImageResponse(BaseModel):
    """Imagen de un producto."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    is_primary: bool
    display_order: int


class AddProductImageRequest(BaseModel):
    """Agregar una imagen a un producto."""

    image_url: str = Field(max_length=500)
    is_primary: bool = False
    display_order: int = 0


# =====================================================================
# RESÚMENES (catálogo)
# =====================================================================

class ProductStoreSummary(BaseModel):
    """Resumen de la tienda que vende el producto."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str


class ProductCategorySummary(BaseModel):
    """Resumen de la categoría del producto."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ProductSummaryResponse(BaseModel):
    """Versión resumida de un producto para listados de catálogo."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    price: Decimal
    status: ProductStatus
    primary_image_url: str | None
    rating_avg: Decimal
    rating_count: int
    sales_count: int
    store: ProductStoreSummary
    category: ProductCategorySummary


# =====================================================================
# DETALLE DE PRODUCTO
# =====================================================================

class ProductResponse(BaseModel):
    """Representación completa de un producto."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    sku: str | None
    status: ProductStatus
    is_moderated: bool
    sales_count: int
    rating_avg: Decimal
    rating_count: int
    store: ProductStoreSummary
    category: ProductCategorySummary
    images: list[ProductImageResponse]
    inventory: InventoryResponse | None
    created_at: datetime


# =====================================================================
# REQUESTS — GESTIÓN DE PRODUCTOS (Admin de Tienda)
# =====================================================================

class CreateProductRequest(BaseModel):
    """Creación de un producto por el Admin de Tienda."""

    category_id: int
    name: str = Field(min_length=3, max_length=200)
    slug: str = Field(min_length=3, max_length=220, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    sku: str | None = Field(default=None, max_length=80)
    initial_stock: int = Field(ge=0, default=0)
    min_stock: int = Field(ge=0, default=5)


class UpdateProductRequest(BaseModel):
    """Actualización de un producto por el Admin de Tienda."""

    category_id: int | None = None
    name: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    sku: str | None = Field(default=None, max_length=80)


class UpdateProductStatusRequest(BaseModel):
    """Habilitar/deshabilitar un producto."""

    status: ProductStatus


# =====================================================================
# FILTROS DE CATÁLOGO (Cliente)
# =====================================================================

class ProductFilterParams(BaseModel):
    """Filtros de búsqueda en el catálogo global."""

    search: str | None = None
    category_id: int | None = None
    store_id: int | None = None
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)
    sort_by: str = Field(default="created_at", pattern="^(price|popularity|created_at)$")
    sort_dir: str = Field(default="desc", pattern="^(asc|desc)$")
