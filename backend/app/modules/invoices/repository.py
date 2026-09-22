"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.invoices.models import Invoice
from app.modules.orders.models import StoreOrder


class InvoiceRepository:
    """Operaciones de acceso a datos para facturas."""

    def __init__(self, db: Session):
        self.db = db

    def list_all(self, offset: int = 0, limit: int = 20) -> tuple[list[Invoice], int]:
        """Lista todas las facturas de la plataforma (Super Admin), más recientes primero."""
        stmt = (
            select(Invoice)
            .options(
                joinedload(Invoice.order),
                joinedload(Invoice.customer),
                joinedload(Invoice.store_order).joinedload(StoreOrder.store),
            )
            .order_by(Invoice.issued_at.desc())
        )
        count_stmt = select(func.count(Invoice.id))

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def get_by_id(self, invoice_id: int) -> Invoice | None:
        stmt = select(Invoice).where(Invoice.id == invoice_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_order_and_store_order(self, order_id: int, store_order_id: int | None) -> Invoice | None:
        stmt = select(Invoice).where(
            Invoice.order_id == order_id, Invoice.store_order_id == store_order_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_order(self, order_id: int) -> list[Invoice]:
        stmt = select(Invoice).where(Invoice.order_id == order_id)
        return list(self.db.execute(stmt).scalars().all())

    def exists_by_number(self, invoice_number: str) -> bool:
        stmt = select(Invoice.id).where(Invoice.invoice_number == invoice_number)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def update(self, invoice: Invoice) -> Invoice:
        self.db.commit()
        self.db.refresh(invoice)
        return invoice