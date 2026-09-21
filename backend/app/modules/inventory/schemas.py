"""
=====================================================================
ARIX BACKEND - Módulo Inventory: Schemas Pydantic
=====================================================================
"""

from pydantic import BaseModel, ConfigDict, Field


class InventoryResponse(BaseModel):
    """Representación del inventario de un producto."""

    model_config = ConfigDict(from_attributes=True)

    product_id: int
    stock_quantity: int
    min_stock: int
    is_low_stock: bool
    is_out_of_stock: bool


class UpdateInventoryRequest(BaseModel):
    """Actualización manual de stock (Admin de Tienda)."""

    stock_quantity: int = Field(ge=0)
    min_stock: int = Field(ge=0, default=5)


class AdjustStockRequest(BaseModel):
    """Ajuste relativo de stock (ej. al recibir mercancía o por devolución)."""

    quantity_delta: int = Field(description="Cantidad a sumar (positivo) o restar (negativo) del stock actual")
