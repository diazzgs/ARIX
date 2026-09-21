"""
=====================================================================
ARIX BACKEND - Módulo Inventory: Service
=====================================================================
"""

from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ResourceNotFoundException,
)
from app.modules.inventory.models import Inventory
from app.modules.inventory.repository import InventoryRepository
from app.modules.inventory.schemas import (
    AdjustStockRequest,
    InventoryResponse,
    UpdateInventoryRequest,
)


class InventoryService:
    """Casos de uso relacionados al inventario de productos."""

    def __init__(self, repository: InventoryRepository):
        self.repository = repository

    def create_for_product(self, product_id: int, stock_quantity: int, min_stock: int) -> Inventory:
        """Crea el registro de inventario inicial para un producto nuevo."""
        inventory = Inventory(
            product_id=product_id,
            stock_quantity=stock_quantity,
            min_stock=min_stock,
        )
        return self.repository.create(inventory)

    def get_by_product(self, product_id: int) -> InventoryResponse:
        inventory = self.repository.get_by_product_id(product_id)
        if inventory is None:
            raise ResourceNotFoundException("Inventario no encontrado para este producto")
        return InventoryResponse.model_validate(inventory)

    def update_inventory(self, product_id: int, data: UpdateInventoryRequest) -> InventoryResponse:
        inventory = self.repository.get_by_product_id(product_id)
        if inventory is None:
            raise ResourceNotFoundException("Inventario no encontrado para este producto")

        inventory.stock_quantity = data.stock_quantity
        inventory.min_stock = data.min_stock
        updated = self.repository.update(inventory)
        return InventoryResponse.model_validate(updated)

    def adjust_stock(self, product_id: int, data: AdjustStockRequest) -> InventoryResponse:
        inventory = self.repository.get_by_product_id(product_id)
        if inventory is None:
            raise ResourceNotFoundException("Inventario no encontrado para este producto")

        new_quantity = inventory.stock_quantity + data.quantity_delta
        if new_quantity < 0:
            raise BadRequestException("El ajuste resultaría en stock negativo")

        inventory.stock_quantity = new_quantity
        updated = self.repository.update(inventory)
        return InventoryResponse.model_validate(updated)

    def decrease_stock(self, product_id: int, quantity: int) -> None:
        """Disminuye el stock al confirmarse una compra. Usado por el módulo de órdenes."""
        inventory = self.repository.get_by_product_id(product_id)
        if inventory is None:
            raise ResourceNotFoundException("Inventario no encontrado para este producto")

        if inventory.stock_quantity < quantity:
            raise BadRequestException(f"Stock insuficiente para el producto (disponible: {inventory.stock_quantity})")

        inventory.stock_quantity -= quantity
        self.repository.update(inventory)

    def list_low_stock(self, store_id: int) -> list[InventoryResponse]:
        items = self.repository.list_low_stock_by_store(store_id)
        return [InventoryResponse.model_validate(i) for i in items]
