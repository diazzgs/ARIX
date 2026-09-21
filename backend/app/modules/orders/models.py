"""
=====================================================================
ARIX BACKEND - Módulo Orders: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: orders, store_orders, order_items, payments
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import OrderStatus, PaymentMethod, PaymentStatus
from app.db.base import Base
from app.modules.products.models import Product  # noqa: F401
from app.modules.stores.models import Store  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Order(Base):
    """Tabla: orders — Orden principal del cliente."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=OrderStatus.PENDING.value
    )
    shipping_address: Mapped[str] = mapped_column(String(255), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    customer: Mapped["User"] = relationship()
    store_orders: Mapped[list["StoreOrder"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="StoreOrder.id"
    )
    payment: Mapped["Payment"] = relationship(
        back_populates="order", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} order_number={self.order_number}>"


class StoreOrder(Base):
    """Tabla: store_orders — Suborden por tienda dentro de una orden principal."""

    __tablename__ = "store_orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    sub_order_number: Mapped[str] = mapped_column(String(35), unique=True, nullable=False)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    store_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stores.id"), nullable=False)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=OrderStatus.PENDING.value
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    order: Mapped["Order"] = relationship(back_populates="store_orders")
    store: Mapped["Store"] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="store_order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<StoreOrder id={self.id} sub_order_number={self.sub_order_number}>"


class OrderItem(Base):
    """Tabla: order_items — Detalle de productos por suborden."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    store_order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("store_orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)

    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    store_order: Mapped["StoreOrder"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} product_id={self.product_id} qty={self.quantity}>"


class Payment(Base):
    """Tabla: payments — Pago simulado asociado a la orden principal."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    card_last_digits: Mapped[str | None] = mapped_column(String(4), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=PaymentStatus.APPROVED.value
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment id={self.id} order_id={self.order_id} status={self.status}>"
