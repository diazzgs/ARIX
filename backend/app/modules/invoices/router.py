"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Router
=====================================================================
Expone los endpoints de:
  - Listado/generación de facturas de una orden (Cliente)
  - Descarga del PDF de una factura (Cliente)
=====================================================================
"""

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.invoices.repository import InvoiceRepository
from app.modules.invoices.schemas import InvoiceResponse
from app.modules.invoices.service import InvoiceService
from app.modules.orders.repository import OrderRepository
from app.modules.users.models import User

router = APIRouter(tags=["Facturación"])


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(InvoiceRepository(db), OrderRepository(db))


# =====================================================================
# CLIENTE — /api/orders/{order_id}/invoices
# =====================================================================

@router.get(
    "/orders/{order_id}/invoices",
    response_model=ApiResponse[list[InvoiceResponse]],
    summary="Listar facturas de mi orden (Cliente)",
)
def list_order_invoices(
    order_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """
    Lista las facturas de una orden propia (una por tienda + consolidada).

    Si las facturas aún no existen, se generan en este momento.
    """
    result = service.get_or_generate_invoices_for_order(current_user.id, order_id)
    return ApiResponse.ok(result)


@router.get(
    "/invoices/{invoice_id}/download",
    summary="Descargar PDF de una factura (Cliente)",
)
def download_invoice_pdf(
    invoice_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Descarga el archivo PDF de una factura propia."""
    pdf_path = service.get_invoice_pdf_path(current_user.id, invoice_id)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_path.name,
    )
