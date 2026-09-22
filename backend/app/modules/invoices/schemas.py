"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Schemas Pydantic
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.common.enums.statuses import InvoiceType


class InvoiceResponse(BaseModel):
    """Representación de una factura generada."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    order_id: int
    store_order_id: int | None
    type: InvoiceType
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    pdf_url: str | None
    issued_at: datetime


class AdminInvoiceResponse(BaseModel):
    """Representación de una factura para el listado del Super Admin, con contexto adicional."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    order_id: int
    order_number: str
    store_order_id: int | None
    store_name: str | None
    customer_name: str
    type: InvoiceType
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    pdf_url: str | None
    issued_at: datetime