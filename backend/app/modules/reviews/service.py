"""
=====================================================================
ARIX BACKEND - Módulo Reviews: Service
=====================================================================
Gestiona la creación, edición, eliminación y moderación de reseñas,
y mantiene sincronizados los campos rating_avg y rating_count del
producto correspondiente.
=====================================================================
"""

from decimal import ROUND_HALF_UP, Decimal

from app.common.exceptions.custom_exceptions import (
    ConflictException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.products.repository import ProductRepository
from app.modules.reviews.models import Review
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schemas import (
    CreateReviewRequest,
    ModerateReviewRequest,
    ReviewResponse,
    UpdateReviewRequest,
)


class ReviewService:
    """Casos de uso relacionados a reseñas de productos."""

    def __init__(self, repository: ReviewRepository, product_repository: ProductRepository):
        self.repository = repository
        self.product_repository = product_repository

    # -----------------------------------------------------------------
    # Cliente
    # -----------------------------------------------------------------

    def create_review(self, customer_id: int, product_id: int, data: CreateReviewRequest) -> ReviewResponse:
        product = self.product_repository.get_by_id(product_id)
        if product is None:
            raise ResourceNotFoundException("Producto no encontrado")

        existing = self.repository.get_by_product_and_customer(product_id, customer_id)
        if existing is not None:
            raise ConflictException("Ya has dejado una reseña para este producto")

        if not self.repository.has_purchased_product(customer_id, product_id):
            raise ForbiddenException("Solo puedes reseñar productos que hayas comprado")

        review = Review(
            product_id=product_id,
            customer_id=customer_id,
            rating=data.rating,
            comment=data.comment,
            status="VISIBLE",
        )
        created = self.repository.create(review)

        self._recalculate_product_rating(product_id)

        refreshed = self.repository.get_by_id(created.id)
        return ReviewResponse.model_validate(refreshed)

    def update_my_review(self, customer_id: int, review_id: int, data: UpdateReviewRequest) -> ReviewResponse:
        review = self._get_or_404(review_id)

        if review.customer_id != customer_id:
            raise ForbiddenException("No puedes editar la reseña de otro usuario")

        if data.rating is not None:
            review.rating = data.rating
        if data.comment is not None:
            review.comment = data.comment

        updated = self.repository.update(review)
        self._recalculate_product_rating(review.product_id)

        refreshed = self.repository.get_by_id(updated.id)
        return ReviewResponse.model_validate(refreshed)

    def delete_my_review(self, customer_id: int, review_id: int) -> None:
        review = self._get_or_404(review_id)

        if review.customer_id != customer_id:
            raise ForbiddenException("No puedes eliminar la reseña de otro usuario")

        product_id = review.product_id
        self.repository.delete(review)
        self._recalculate_product_rating(product_id)

    def report_review(self, customer_id: int, review_id: int) -> ReviewResponse:
        """Permite a un cliente reportar una reseña inapropiada (de otro usuario)."""
        review = self._get_or_404(review_id)

        if review.status == "REPORTED":
            raise ConflictException("Esta reseña ya ha sido reportada")

        review.status = "REPORTED"
        updated = self.repository.update(review)

        refreshed = self.repository.get_by_id(updated.id)
        return ReviewResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Público
    # -----------------------------------------------------------------

    def list_product_reviews(self, product_id: int, page: int, size: int) -> PageResponse[ReviewResponse]:
        offset = max(page - 1, 0) * size
        reviews, total = self.repository.list_visible_by_product(product_id, offset=offset, limit=size)
        items = [ReviewResponse.model_validate(r) for r in reviews]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    # -----------------------------------------------------------------
    # Moderación (Super Admin)
    # -----------------------------------------------------------------

    def list_reported_reviews(self, page: int, size: int) -> PageResponse[ReviewResponse]:
        offset = max(page - 1, 0) * size
        reviews, total = self.repository.list_reported(offset=offset, limit=size)
        items = [ReviewResponse.model_validate(r) for r in reviews]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    def moderate_review(self, review_id: int, data: ModerateReviewRequest) -> ReviewResponse:
        review = self._get_or_404(review_id)

        review.status = data.status.value
        updated = self.repository.update(review)
        self._recalculate_product_rating(review.product_id)

        refreshed = self.repository.get_by_id(updated.id)
        return ReviewResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_or_404(self, review_id: int) -> Review:
        review = self.repository.get_by_id(review_id)
        if review is None:
            raise ResourceNotFoundException("Reseña no encontrada")
        return review

    def _recalculate_product_rating(self, product_id: int) -> None:
        """Recalcula rating_avg y rating_count del producto a partir de sus reseñas visibles."""
        visible_reviews, total = self.repository.list_visible_by_product(product_id, offset=0, limit=10_000)

        product = self.product_repository.get_by_id(product_id)
        if product is None:
            return

        if total == 0:
            product.rating_avg = Decimal("0.00")
            product.rating_count = 0
        else:
            avg = sum(Decimal(r.rating) for r in visible_reviews) / Decimal(total)
            product.rating_avg = avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            product.rating_count = total

        self.product_repository.update(product)
