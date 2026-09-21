"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: invoices
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import InvoiceType
from app.db.base import Base
from app.modules.orders.models import Order, StoreOrder  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Invoice(Base):
    """Tabla: invoices"""

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(String(35), unique=True, nullable=False)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    store_order_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("store_orders.id", ondelete="CASCADE"), nullable=True
    )

    type: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    issued_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    order: Mapped["Order"] = relationship()
    store_order: Mapped["StoreOrder | None"] = relationship()
    customer: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<Invoice id={self.id} invoice_number={self.invoice_number} type={self.type}>"
