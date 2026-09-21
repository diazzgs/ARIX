"""
=====================================================================
ARIX BACKEND - Módulo Reviews: Router
=====================================================================
Expone los endpoints de:
  - Listado público de reseñas de un producto
  - Creación/edición/eliminación de reseñas propias (Cliente)
  - Reporte de reseñas (Cliente)
  - Moderación de reseñas reportadas (Super Admin)
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.products.repository import ProductRepository
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schemas import (
    CreateReviewRequest,
    ModerateReviewRequest,
    ReviewResponse,
    UpdateReviewRequest,
)
from app.modules.reviews.service import ReviewService
from app.modules.users.models import User

router = APIRouter(tags=["Reseñas"])


def get_review_service(db: Session = Depends(get_db)) -> ReviewService:
    return ReviewService(ReviewRepository(db), ProductRepository(db))


# =====================================================================
# PÚBLICO — /api/products/{product_id}/reviews
# =====================================================================

@router.get(
    "/products/{product_id}/reviews",
    response_model=ApiResponse[PageResponse[ReviewResponse]],
    summary="Listar reseñas de un producto (público)",
)
def list_product_reviews(
    product_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=50),
    service: ReviewService = Depends(get_review_service),
):
    """Lista las reseñas visibles de un producto, ordenadas de más recientes a más antiguas."""
    result = service.list_product_reviews(product_id, page, size)
    return ApiResponse.ok(result)


# =====================================================================
# CLIENTE — /api/products/{product_id}/reviews y /api/reviews/{id}
# =====================================================================

@router.post(
    "/products/{product_id}/reviews",
    response_model=ApiResponse[ReviewResponse],
    summary="Crear reseña de un producto (Cliente)",
)
def create_review(
    product_id: int,
    data: CreateReviewRequest,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: ReviewService = Depends(get_review_service),
):
    """
    Crea una reseña para un producto.

    Solo se permite una reseña por cliente y producto, y únicamente
    si el cliente ha comprado el producto previamente.
    """
    result = service.create_review(current_user.id, product_id, data)
    return ApiResponse.ok(result, message="Reseña publicada exitosamente")


@router.put(
    "/reviews/{review_id}",
    response_model=ApiResponse[ReviewResponse],
    summary="Editar mi reseña (Cliente)",
)
def update_my_review(
    review_id: int,
    data: UpdateReviewRequest,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: ReviewService = Depends(get_review_service),
):
    """Edita la calificación y/o comentario de una reseña propia."""
    result = service.update_my_review(current_user.id, review_id, data)
    return ApiResponse.ok(result, message="Reseña actualizada correctamente")


@router.delete(
    "/reviews/{review_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar mi reseña (Cliente)",
)
def delete_my_review(
    review_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: ReviewService = Depends(get_review_service),
):
    """Elimina una reseña propia."""
    service.delete_my_review(current_user.id, review_id)
    return ApiResponse.ok({}, message="Reseña eliminada correctamente")


@router.post(
    "/reviews/{review_id}/report",
    response_model=ApiResponse[ReviewResponse],
    summary="Reportar una reseña (Cliente)",
)
def report_review(
    review_id: int,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: ReviewService = Depends(get_review_service),
):
    """Marca una reseña como reportada para revisión del Super Admin."""
    result = service.report_review(current_user.id, review_id)
    return ApiResponse.ok(result, message="Reseña reportada. Será revisada por un administrador")


# =====================================================================
# SUPER ADMIN — /api/admin/reviews
# =====================================================================

@router.get(
    "/admin/reviews/reported",
    response_model=ApiResponse[PageResponse[ReviewResponse]],
    summary="Listar reseñas reportadas (Super Admin)",
)
def list_reported_reviews(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: ReviewService = Depends(get_review_service),
):
    """Lista las reseñas marcadas como reportadas, pendientes de moderación."""
    result = service.list_reported_reviews(page, size)
    return ApiResponse.ok(result)


@router.put(
    "/admin/reviews/{review_id}/moderate",
    response_model=ApiResponse[ReviewResponse],
    summary="Moderar reseña (Super Admin)",
)
def moderate_review(
    review_id: int,
    data: ModerateReviewRequest,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: ReviewService = Depends(get_review_service),
):
    """Cambia el estado de una reseña (VISIBLE, HIDDEN, REPORTED)."""
    result = service.moderate_review(review_id, data)
    return ApiResponse.ok(result, message="Reseña moderada correctamente")
