"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Repository
=====================================================================
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.invoices.models import Invoice


class InvoiceRepository:
    """Operaciones de acceso a datos para facturas."""

    def __init__(self, db: Session):
        self.db = db

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
