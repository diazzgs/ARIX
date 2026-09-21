"""
=====================================================================
ARIX BACKEND - Módulo Favorites: Service
=====================================================================
"""

from app.common.exceptions.custom_exceptions import ConflictException, ResourceNotFoundException
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.favorites.models import Favorite
from app.modules.favorites.repository import FavoriteRepository
from app.modules.favorites.schemas import FavoriteResponse
from app.modules.products.repository import ProductRepository


class FavoriteService:
    """Casos de uso relacionados a productos favoritos del cliente."""

    def __init__(self, repository: FavoriteRepository, product_repository: ProductRepository):
        self.repository = repository
        self.product_repository = product_repository

    def add_favorite(self, customer_id: int, product_id: int) -> FavoriteResponse:
        product = self.product_repository.get_by_id(product_id)
        if product is None:
            raise ResourceNotFoundException("Producto no encontrado")

        existing = self.repository.get_by_customer_and_product(customer_id, product_id)
        if existing is not None:
            raise ConflictException("Este producto ya está en tus favoritos")

        favorite = Favorite(customer_id=customer_id, product_id=product_id)
        created = self.repository.create(favorite)

        refreshed = self.repository.get_by_id(created.id)
        return FavoriteResponse.model_validate(refreshed)

    def remove_favorite(self, customer_id: int, product_id: int) -> None:
        favorite = self.repository.get_by_customer_and_product(customer_id, product_id)
        if favorite is None:
            raise ResourceNotFoundException("Este producto no está en tus favoritos")

        self.repository.delete(favorite)

    def list_my_favorites(self, customer_id: int, page: int, size: int) -> PageResponse[FavoriteResponse]:
        offset = max(page - 1, 0) * size
        favorites, total = self.repository.list_by_customer(customer_id, offset=offset, limit=size)
        items = [FavoriteResponse.model_validate(f) for f in favorites]
        return PageResponse.create(items, total, PageParams(page=page, size=size))
