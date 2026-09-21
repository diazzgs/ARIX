"""
=====================================================================
ARIX BACKEND - Módulo Inventory: Router
=====================================================================
Endpoints de gestión de inventario por el Admin de Tienda.
La verificación de que el producto pertenece a la tienda del admin
se realiza a través del módulo products (ver products/router.py),
por lo que estos endpoints reciben el product_id ya autorizado.
=====================================================================
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.exceptions.custom_exceptions import ForbiddenException, ResourceNotFoundException
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.inventory.repository import InventoryRepository
from app.modules.inventory.schemas import (
    AdjustStockRequest,
    InventoryResponse,
    UpdateInventoryRequest,
)
from app.modules.inventory.service import InventoryService
from app.modules.products.repository import ProductRepository
from app.modules.stores.repository import StoreRepository
from app.modules.users.models import User

router = APIRouter(tags=["Inventario"])


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    return InventoryService(InventoryRepository(db))


def _ensure_product_belongs_to_admin(db: Session, product_id: int, admin_user_id: int) -> None:
    """Verifica que el producto pertenezca a la tienda del admin autenticado."""
    store = StoreRepository(db).get_by_admin_user_id(admin_user_id)
    if store is None:
        raise ResourceNotFoundException("No tienes una tienda asignada")

    product = ProductRepository(db).get_by_id(product_id)
    if product is None:
        raise ResourceNotFoundException("Producto no encontrado")

    if product.store_id != store.id:
        raise ForbiddenException("Este producto no pertenece a tu tienda")


# =====================================================================
# ADMIN DE TIENDA — /api/store/products/{product_id}/inventory
# =====================================================================

@router.get(
    "/store/products/{product_id}/inventory",
    response_model=ApiResponse[InventoryResponse],
    summary="Obtener inventario de un producto (Admin de Tienda)",
)
def get_product_inventory(
    product_id: int,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    db: Session = Depends(get_db),
    service: InventoryService = Depends(get_inventory_service),
):
    """Obtiene el stock actual, mínimo y banderas de alerta del producto."""
    _ensure_product_belongs_to_admin(db, product_id, current_user.id)
    result = service.get_by_product(product_id)
    return ApiResponse.ok(result)


@router.put(
    "/store/products/{product_id}/inventory",
    response_model=ApiResponse[InventoryResponse],
    summary="Actualizar inventario de un producto (Admin de Tienda)",
)
def update_product_inventory(
    product_id: int,
    data: UpdateInventoryRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    db: Session = Depends(get_db),
    service: InventoryService = Depends(get_inventory_service),
):
    """Establece manualmente el stock actual y el stock mínimo de alerta."""
    _ensure_product_belongs_to_admin(db, product_id, current_user.id)
    result = service.update_inventory(product_id, data)
    return ApiResponse.ok(result, message="Inventario actualizado correctamente")


@router.patch(
    "/store/products/{product_id}/inventory/adjust",
    response_model=ApiResponse[InventoryResponse],
    summary="Ajustar stock de un producto (Admin de Tienda)",
)
def adjust_product_inventory(
    product_id: int,
    data: AdjustStockRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    db: Session = Depends(get_db),
    service: InventoryService = Depends(get_inventory_service),
):
    """Suma o resta unidades al stock actual (ej. reabastecimiento)."""
    _ensure_product_belongs_to_admin(db, product_id, current_user.id)
    result = service.adjust_stock(product_id, data)
    return ApiResponse.ok(result, message="Stock ajustado correctamente")


@router.get(
    "/store/inventory/low-stock",
    response_model=ApiResponse[list[InventoryResponse]],
    summary="Listar productos con stock bajo (Admin de Tienda)",
)
def list_low_stock_products(
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    db: Session = Depends(get_db),
    service: InventoryService = Depends(get_inventory_service),
):
    """Lista los productos cuya cantidad en stock está en o por debajo del mínimo."""
    store = StoreRepository(db).get_by_admin_user_id(current_user.id)
    if store is None:
        raise ResourceNotFoundException("No tienes una tienda asignada")

    result = service.list_low_stock(store.id)
    return ApiResponse.ok(result)
