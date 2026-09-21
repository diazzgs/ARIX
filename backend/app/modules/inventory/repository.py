"""
=====================================================================
ARIX BACKEND - Módulo Inventory: Repository
=====================================================================
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.inventory.models import Inventory


class InventoryRepository:
    """Operaciones de acceso a datos para el inventario de productos."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_product_id(self, product_id: int) -> Inventory | None:
        stmt = select(Inventory).where(Inventory.product_id == product_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, inventory: Inventory) -> Inventory:
        self.db.add(inventory)
        self.db.commit()
        self.db.refresh(inventory)
        return inventory

    def update(self, inventory: Inventory) -> Inventory:
        self.db.commit()
        self.db.refresh(inventory)
        return inventory

    def list_low_stock_by_store(self, store_id: int) -> list[Inventory]:
        """Productos con stock <= min_stock para una tienda dada."""
        from app.modules.products.models import Product  # import local para evitar ciclo

        stmt = (
            select(Inventory)
            .join(Product, Product.id == Inventory.product_id)
            .where(Product.store_id == store_id)
            .where(Inventory.stock_quantity <= Inventory.min_stock)
        )
        return list(self.db.execute(stmt).scalars().all())
