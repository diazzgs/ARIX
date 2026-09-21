"""
=====================================================================
ARIX BACKEND - Módulo Inventory: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: inventory (relación 1:1 con products)
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Inventory(Base):
    """Tabla: inventory"""

    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    product: Mapped["Product"] = relationship(back_populates="inventory")  # noqa: F821

    @property
    def is_low_stock(self) -> bool:
        return self.stock_quantity <= self.min_stock

    @property
    def is_out_of_stock(self) -> bool:
        return self.stock_quantity <= 0

    def __repr__(self) -> str:
        return f"<Inventory product_id={self.product_id} stock={self.stock_quantity}>"
