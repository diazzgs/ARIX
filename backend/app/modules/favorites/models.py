"""
=====================================================================
ARIX BACKEND - Módulo Favorites: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: favorites
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.modules.products.models import Product  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Favorite(Base):
    """Tabla: favorites"""

    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("customer_id", "product_id", name="uq_favorites_customer_product"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    product: Mapped["Product"] = relationship()

    def __repr__(self) -> str:
        return f"<Favorite customer_id={self.customer_id} product_id={self.product_id}>"
