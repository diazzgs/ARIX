"""
=====================================================================
ARIX BACKEND - Módulo Invoices: Router
=====================================================================
Expone los endpoints de:
  - Listado/generación de facturas de una orden (Cliente)
  - Descarga del PDF de una factura (Cliente)
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.invoices.repository import InvoiceRepository
from app.modules.invoices.schemas import AdminInvoiceResponse, InvoiceResponse
from app.modules.invoices.service import InvoiceService
from app.modules.orders.repository import OrderRepository
from app.modules.stores.repository import StoreRepository
from app.modules.users.models import User

router = APIRouter(tags=["Facturación"])


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(InvoiceRepository(db), OrderRepository(db), StoreRepository(db))


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


# =====================================================================
# SUPER ADMIN — /api/admin/invoices
# =====================================================================

@router.get(
    "/admin/invoices",
    response_model=ApiResponse[PageResponse[AdminInvoiceResponse]],
    summary="Listar todas las facturas de la plataforma (Super Admin)",
)
def list_all_invoices(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Lista todas las facturas generadas en la plataforma, más recientes primero."""
    result = service.list_all_invoices(page, size)
    return ApiResponse.ok(result)


@router.get(
    "/admin/invoices/{invoice_id}/download",
    summary="Descargar PDF de cualquier factura (Super Admin)",
)
def download_invoice_pdf_as_admin(
    invoice_id: int,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Descarga el archivo PDF de cualquier factura de la plataforma."""
    pdf_path = service.get_invoice_pdf_path_as_admin(invoice_id)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_path.name,
    )


# =====================================================================
# ADMIN DE TIENDA — /api/store/orders/{store_order_id}/invoice
# =====================================================================

@router.get(
    "/store/orders/{store_order_id}/invoice",
    response_model=ApiResponse[InvoiceResponse],
    summary="Obtener factura de un pedido (Admin de Tienda)",
)
def get_store_order_invoice(
    store_order_id: int,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """
    Obtiene la factura (tipo STORE) de un pedido propio de la tienda del
    Admin de Tienda autenticado, generándola en este momento si aún no existe.
    """
    result = service.get_or_generate_store_invoice(current_user.id, store_order_id)
    return ApiResponse.ok(result)


@router.get(
    "/store/invoices/{invoice_id}/download",
    summary="Descargar PDF de una factura de mi tienda (Admin de Tienda)",
)
def download_store_invoice_pdf(
    invoice_id: int,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Descarga el archivo PDF de una factura (tipo STORE) propia de la tienda."""
    pdf_path = service.get_store_invoice_pdf_path(current_user.id, invoice_id)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=pdf_path.name,
    )