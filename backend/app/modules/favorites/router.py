"""
=====================================================================
ARIX BACKEND - Módulo Favorites: Router
=====================================================================
Expone los endpoints de gestión de productos favoritos del Cliente.
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.favorites.repository import FavoriteRepository
from app.modules.favorites.schemas import AddFavoriteRequest, FavoriteResponse
from app.modules.favorites.service import FavoriteService
from app.modules.products.repository import ProductRepository
from app.modules.users.models import User

router = APIRouter(tags=["Favoritos"])


def get_favorite_service(db: Session = Depends(get_db)) -> FavoriteService:
    return FavoriteService(FavoriteRepository(db), ProductRepository(db))


# =====================================================================
# CLIENTE — /api/favorites
# =====================================================================

@router.get(
    "/favorites",
    response_model=ApiResponse[PageResponse[FavoriteResponse]],
    summary="Listar mis productos favoritos (Cliente)",
)
def list_my_favorites(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: FavoriteService = Depends(get_favorite_service),
):
    """Lista los productos guardados como favoritos por el cliente autenticado."""
    result = service.list_my_favorites(current_user.id, page, size)
    return ApiResponse.ok(result)


@router.post(
    "/favorites",
    response_model=ApiResponse[FavoriteResponse],
    summary="Agregar producto a favoritos (Cliente)",
)
def add_favorite(
    data: AddFavoriteRequest,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: FavoriteService = Depends(get_favorite_service),
):
    """Agrega un producto a la lista de favoritos del cliente autenticado."""
    result = service.add_favorite(current_user.id, data.product_id)
    return ApiResponse.ok(result, message="Producto agregado a favoritos")


@router.delete(
    "/favorites/{product_id}",
    response_model=ApiResponse[dict],
    summary="Quitar producto de favoritos (Cliente)",
)
def remove_favorite(
    product_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: FavoriteService = Depends(get_favorite_service),
):
    """Elimina un producto de la lista de favoritos del cliente autenticado."""
    service.remove_favorite(current_user.id, product_id)
    return ApiResponse.ok({}, message="Producto eliminado de favoritos")
