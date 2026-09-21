"""
=====================================================================
ARIX BACKEND - Módulo Orders: Router
=====================================================================
Expone los endpoints de:
  - Checkout e historial de órdenes (Cliente)
  - Gestión de subórdenes (Admin de Tienda)
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.enums.statuses import OrderStatus
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.inventory.repository import InventoryRepository
from app.modules.orders.repository import OrderRepository
from app.modules.orders.schemas import (
    CheckoutRequest,
    OrderResponse,
    OrderSummaryResponse,
    StoreOrderListItemResponse,
    StoreOrderResponse,
    UpdateStoreOrderStatusRequest,
)
from app.modules.orders.service import OrderService
from app.modules.products.repository import ProductRepository
from app.modules.stores.repository import StoreRepository
from app.modules.users.models import User

router = APIRouter(tags=["Órdenes"])


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(
        OrderRepository(db),
        ProductRepository(db),
        InventoryRepository(db),
        StoreRepository(db),
    )


# =====================================================================
# CLIENTE — /api/orders
# =====================================================================

@router.post(
    "/orders/checkout",
    response_model=ApiResponse[OrderResponse],
    summary="Procesar checkout (Cliente)",
)
def checkout(
    data: CheckoutRequest,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: OrderService = Depends(get_order_service),
):
    """
    Procesa el checkout del carrito. Si el carrito contiene productos de
    varias tiendas, se genera una orden principal con una suborden por
    cada tienda involucrada. El pago es simulado (sin pasarela real).
    """
    result = service.checkout(current_user.id, data)
    return ApiResponse.ok(result, message="Compra procesada exitosamente")


@router.get(
    "/orders",
    response_model=ApiResponse[PageResponse[OrderSummaryResponse]],
    summary="Listar mis órdenes (Cliente)",
)
def list_my_orders(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: OrderService = Depends(get_order_service),
):
    """Lista el historial de órdenes del cliente autenticado."""
    result = service.list_my_orders(current_user.id, page, size)
    return ApiResponse.ok(result)


@router.get(
    "/orders/{order_id}",
    response_model=ApiResponse[OrderResponse],
    summary="Detalle de mi orden (Cliente)",
)
def get_order_detail(
    order_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: OrderService = Depends(get_order_service),
):
    """Obtiene el detalle completo de una orden propia, incluyendo subórdenes y pago."""
    result = service.get_order_detail(current_user.id, order_id)
    return ApiResponse.ok(result)


# =====================================================================
# ADMIN DE TIENDA — /api/store/orders
# =====================================================================

@router.get(
    "/store/orders",
    response_model=ApiResponse[PageResponse[StoreOrderListItemResponse]],
    summary="Listar pedidos de mi tienda (Admin de Tienda)",
)
def list_store_orders(
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: OrderService = Depends(get_order_service),
):
    """Lista las subórdenes (pedidos) correspondientes a la tienda del admin autenticado."""
    result = service.list_store_orders(current_user.id, status_filter, page, size)
    return ApiResponse.ok(result)


@router.put(
    "/store/orders/{store_order_id}/status",
    response_model=ApiResponse[StoreOrderResponse],
    summary="Cambiar estado de un pedido (Admin de Tienda)",
)
def update_store_order_status(
    store_order_id: int,
    data: UpdateStoreOrderStatusRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: OrderService = Depends(get_order_service),
):
    """
    Cambia el estado de una suborden propia.

    Flujo esperado: CONFIRMED -> PREPARING -> SHIPPED -> DELIVERED,
    o CANCELLED en cualquier punto antes de DELIVERED.
    """
    result = service.update_store_order_status(current_user.id, store_order_id, data)
    return ApiResponse.ok(result, message="Estado del pedido actualizado correctamente")
