"""
=====================================================================
ARIX BACKEND - Módulo Reviews: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: reviews
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import ReviewStatus
from app.db.base import Base
from app.modules.products.models import Product  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Review(Base):
    """Tabla: reviews"""

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("product_id", "customer_id", name="uq_reviews_product_customer"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=ReviewStatus.VISIBLE.value
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    product: Mapped["Product"] = relationship()
    customer: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<Review id={self.id} product_id={self.product_id} rating={self.rating}>"
