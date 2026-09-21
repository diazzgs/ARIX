"""
=====================================================================
ARIX BACKEND - Módulo Favorites: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.favorites.models import Favorite
from app.modules.products.models import Product


class FavoriteRepository:
    """Operaciones de acceso a datos para favoritos."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_customer_and_product(self, customer_id: int, product_id: int) -> Favorite | None:
        stmt = select(Favorite).where(
            Favorite.customer_id == customer_id, Favorite.product_id == product_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_id(self, favorite_id: int) -> Favorite | None:
        stmt = (
            select(Favorite)
            .options(
                joinedload(Favorite.product).joinedload(Product.store),
                joinedload(Favorite.product).joinedload(Product.category),
                joinedload(Favorite.product).joinedload(Product.images),
            )
            .where(Favorite.id == favorite_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_by_customer(self, customer_id: int, offset: int = 0, limit: int = 10) -> tuple[list[Favorite], int]:
        stmt = (
            select(Favorite)
            .options(
                joinedload(Favorite.product).joinedload(Product.store),
                joinedload(Favorite.product).joinedload(Product.category),
                joinedload(Favorite.product).joinedload(Product.images),
            )
            .where(Favorite.customer_id == customer_id)
            .order_by(Favorite.created_at.desc())
        )
        count_stmt = select(func.count(Favorite.id)).where(Favorite.customer_id == customer_id)

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def create(self, favorite: Favorite) -> Favorite:
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def delete(self, favorite: Favorite) -> None:
        self.db.delete(favorite)
        self.db.commit()
