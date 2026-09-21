"""
=====================================================================
ARIX BACKEND - Módulo Products: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: products, product_images
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import ProductStatus
from app.db.base import Base
from app.modules.categories.models import Category  # noqa: F401
from app.modules.inventory.models import Inventory
from app.modules.stores.models import Store  # noqa: F401


class Product(Base):
    """Tabla: products"""

    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("store_id", "slug", name="uq_products_store_slug"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("categories.id"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(80), nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=ProductStatus.ACTIVE.value
    )
    is_moderated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    sales_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False, default=0)
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    store: Mapped["Store"] = relationship()  # noqa: F821
    category: Mapped["Category"] = relationship()  # noqa: F821
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order"
    )
    inventory: Mapped["Inventory"] = relationship(
        back_populates="product", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def primary_image_url(self) -> str | None:
        for image in self.images:
            if image.is_primary:
                return image.image_url
        return self.images[0].image_url if self.images else None

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name}>"


class ProductImage(Base):
    """Tabla: product_images"""

    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    product: Mapped["Product"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<ProductImage id={self.id} product_id={self.product_id}>"
