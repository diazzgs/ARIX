"""
=====================================================================
ARIX BACKEND - Módulo Categories: Router
=====================================================================
Expone los endpoints de:
  - Listado público de categorías (catálogo)
  - Gestión de categorías por el Super Administrador
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.categories.repository import CategoryRepository
from app.modules.categories.schemas import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)
from app.modules.categories.service import CategoryService
from app.modules.users.models import User

router = APIRouter(tags=["Categorías"])


def get_category_service(db: Session = Depends(get_db)) -> CategoryService:
    return CategoryService(CategoryRepository(db))


# =====================================================================
# PÚBLICO — /api/categories
# =====================================================================

@router.get(
    "/categories",
    response_model=ApiResponse[list[CategoryResponse]],
    summary="Listar categorías (público)",
)
def list_categories(
    flat: bool = Query(default=False, description="Si es true, retorna lista plana sin anidar"),
    service: CategoryService = Depends(get_category_service),
):
    """Lista las categorías del catálogo. Por defecto retorna el árbol jerárquico."""
    if flat:
        result = service.list_categories_flat()
    else:
        result = service.list_categories_tree()
    return ApiResponse.ok(result)


@router.get(
    "/categories/{category_id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Obtener categoría por ID (público)",
)
def get_category(category_id: int, service: CategoryService = Depends(get_category_service)):
    """Obtiene una categoría con sus subcategorías."""
    result = service.get_category(category_id)
    return ApiResponse.ok(result)


# =====================================================================
# SUPER ADMIN — /api/admin/categories
# =====================================================================

@router.post(
    "/admin/categories",
    response_model=ApiResponse[CategoryResponse],
    summary="Crear categoría (Super Admin)",
)
def create_category(
    data: CreateCategoryRequest,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: CategoryService = Depends(get_category_service),
):
    """Crea una nueva categoría o subcategoría del catálogo global."""
    result = service.create_category(data)
    return ApiResponse.ok(result, message="Categoría creada exitosamente")


@router.put(
    "/admin/categories/{category_id}",
    response_model=ApiResponse[CategoryResponse],
    summary="Editar categoría (Super Admin)",
)
def update_category(
    category_id: int,
    data: UpdateCategoryRequest,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: CategoryService = Depends(get_category_service),
):
    """Actualiza nombre, descripción o categoría padre."""
    result = service.update_category(category_id, data)
    return ApiResponse.ok(result, message="Categoría actualizada correctamente")


@router.delete(
    "/admin/categories/{category_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar categoría (Super Admin)",
)
def delete_category(
    category_id: int,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: CategoryService = Depends(get_category_service),
):
    """Elimina una categoría, siempre que no tenga subcategorías ni productos."""
    service.delete_category(category_id)
    return ApiResponse.ok({}, message="Categoría eliminada correctamente")
