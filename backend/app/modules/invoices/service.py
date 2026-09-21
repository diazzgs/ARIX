"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Service
=====================================================================
Genera (de forma perezosa/idempotente) las facturas PDF asociadas a
una orden: una factura por cada tienda (STORE) y una consolidada
(CONSOLIDATED). Si ya existen, retorna las existentes sin regenerar.
=====================================================================
"""

from decimal import Decimal
from pathlib import Path

from app.common.exceptions.custom_exceptions import ForbiddenException, ResourceNotFoundException
from app.common.enums.statuses import InvoiceType
from app.core.config import settings
from app.core.pdf_generator import (
    InvoiceLineItem,
    InvoiceStoreSection,
    generate_consolidated_invoice_pdf,
    generate_store_invoice_pdf,
)
from app.modules.invoices.models import Invoice
from app.modules.invoices.repository import InvoiceRepository
from app.modules.invoices.schemas import InvoiceResponse
from app.modules.orders.repository import OrderRepository
from app.utils.file_storage import SUBFOLDER_INVOICES


class InvoiceService:
    """Casos de uso relacionados a la generación y consulta de facturas."""

    def __init__(self, repository: InvoiceRepository, order_repository: OrderRepository):
        self.repository = repository
        self.order_repository = order_repository

    # -----------------------------------------------------------------
    # Listado / generación de facturas de una orden (Cliente)
    # -----------------------------------------------------------------

    def get_or_generate_invoices_for_order(self, customer_id: int, order_id: int) -> list[InvoiceResponse]:
        """
        Retorna todas las facturas (una por tienda + consolidada) de una
        orden propia, generándolas si aún no existen.
        """
        order = self.order_repository.get_by_id(order_id)
        if order is None:
            raise ResourceNotFoundException("Orden no encontrada")

        if order.customer_id != customer_id:
            raise ForbiddenException("No tienes acceso a esta orden")

        existing = self.repository.list_by_order(order_id)
        if existing:
            return [InvoiceResponse.model_validate(inv) for inv in existing]

        return self._generate_all_invoices(order)

    def get_invoice_pdf_path(self, customer_id: int, invoice_id: int) -> Path:
        """Retorna la ruta del archivo PDF de una factura propia."""
        invoice = self.repository.get_by_id(invoice_id)
        if invoice is None:
            raise ResourceNotFoundException("Factura no encontrada")

        if invoice.customer_id != customer_id:
            raise ForbiddenException("No tienes acceso a esta factura")

        if not invoice.pdf_url:
            raise ResourceNotFoundException("El archivo PDF de esta factura no está disponible")

        relative = invoice.pdf_url.removeprefix("/api/files/")
        path = Path(settings.UPLOAD_DIR) / relative
        if not path.exists():
            raise ResourceNotFoundException("El archivo PDF de esta factura no se encuentra en el servidor")

        return path

    # -----------------------------------------------------------------
    # Generación interna
    # -----------------------------------------------------------------

    def _generate_all_invoices(self, order) -> list[InvoiceResponse]:
        output_dir = Path(settings.UPLOAD_DIR) / SUBFOLDER_INVOICES
        output_dir.mkdir(parents=True, exist_ok=True)

        customer = order.customer
        invoices: list[Invoice] = []

        consolidated_sections: list[InvoiceStoreSection] = []
        grand_subtotal = sum((so.subtotal for so in order.store_orders), start=Decimal("0.00"))
        grand_tax = sum((so.tax_amount for so in order.store_orders), start=Decimal("0.00"))
        grand_total = sum((so.total for so in order.store_orders), start=Decimal("0.00"))

        # --- Una factura por cada tienda (StoreOrder) ---
        for store_order in order.store_orders:
            invoice_number = f"INV-{order.order_number.split('-')[1]}-{store_order.sub_order_number.split('-')[-1]}"

            line_items = [
                InvoiceLineItem(
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    line_total=item.line_total,
                )
                for item in store_order.items
            ]

            filename = f"{invoice_number}.pdf"
            output_path = output_dir / filename

            generate_store_invoice_pdf(
                invoice_number=invoice_number,
                order_number=order.order_number,
                issued_at=order.created_at,
                customer_name=customer.full_name,
                customer_email=customer.email,
                shipping_address=order.shipping_address,
                store_name=store_order.store.business_name,
                items=line_items,
                subtotal=store_order.subtotal,
                tax_amount=store_order.tax_amount,
                total=store_order.total,
                output_path=output_path,
            )

            invoice = Invoice(
                invoice_number=invoice_number,
                order_id=order.id,
                store_order_id=store_order.id,
                type=InvoiceType.STORE.value,
                customer_id=order.customer_id,
                subtotal=store_order.subtotal,
                tax_amount=store_order.tax_amount,
                total=store_order.total,
                pdf_url=f"/api/files/{SUBFOLDER_INVOICES}/{filename}",
            )
            self.repository.create(invoice)
            invoices.append(invoice)

            consolidated_sections.append(
                InvoiceStoreSection(
                    store_name=store_order.store.business_name,
                    sub_order_number=store_order.sub_order_number,
                    items=line_items,
                    subtotal=store_order.subtotal,
                    tax_amount=store_order.tax_amount,
                    total=store_order.total,
                )
            )

        # --- Factura consolidada ---
        consolidated_number = f"INV-{order.order_number.split('-')[1]}-CONSOLIDATED"
        filename = f"{consolidated_number}.pdf"
        output_path = output_dir / filename

        generate_consolidated_invoice_pdf(
            invoice_number=consolidated_number,
            order_number=order.order_number,
            issued_at=order.created_at,
            customer_name=customer.full_name,
            customer_email=customer.email,
            shipping_address=order.shipping_address,
            sections=consolidated_sections,
            grand_subtotal=grand_subtotal,
            grand_tax=grand_tax,
            grand_total=grand_total,
            output_path=output_path,
        )

        consolidated_invoice = Invoice(
            invoice_number=consolidated_number,
            order_id=order.id,
            store_order_id=None,
            type=InvoiceType.CONSOLIDATED.value,
            customer_id=order.customer_id,
            subtotal=grand_subtotal,
            tax_amount=grand_tax,
            total=grand_total,
            pdf_url=f"/api/files/{SUBFOLDER_INVOICES}/{filename}",
        )
        self.repository.create(consolidated_invoice)
        invoices.append(consolidated_invoice)

        return [InvoiceResponse.model_validate(inv) for inv in invoices]
