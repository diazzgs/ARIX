"""
=====================================================================
ARIX BACKEND - Módulo Reviews: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.orders.models import Order, OrderItem, StoreOrder
from app.modules.reviews.models import Review


class ReviewRepository:
    """Operaciones de acceso a datos para reseñas de productos."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, review_id: int) -> Review | None:
        stmt = (
            select(Review)
            .options(joinedload(Review.customer))
            .where(Review.id == review_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_product_and_customer(self, product_id: int, customer_id: int) -> Review | None:
        stmt = select(Review).where(
            Review.product_id == product_id, Review.customer_id == customer_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_visible_by_product(self, product_id: int, offset: int = 0, limit: int = 10) -> tuple[list[Review], int]:
        stmt = (
            select(Review)
            .options(joinedload(Review.customer))
            .where(Review.product_id == product_id, Review.status == "VISIBLE")
            .order_by(Review.created_at.desc())
        )
        count_stmt = select(func.count(Review.id)).where(
            Review.product_id == product_id, Review.status == "VISIBLE"
        )

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_reported(self, offset: int = 0, limit: int = 10) -> tuple[list[Review], int]:
        """Lista reseñas reportadas, para moderación del Super Admin."""
        stmt = (
            select(Review)
            .options(joinedload(Review.customer))
            .where(Review.status == "REPORTED")
            .order_by(Review.updated_at.desc())
        )
        count_stmt = select(func.count(Review.id)).where(Review.status == "REPORTED")

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def has_purchased_product(self, customer_id: int, product_id: int) -> bool:
        """Verifica si el cliente ha comprado este producto en alguna orden."""
        stmt = (
            select(OrderItem.id)
            .join(StoreOrder, StoreOrder.id == OrderItem.store_order_id)
            .join(Order, Order.id == StoreOrder.order_id)
            .where(Order.customer_id == customer_id, OrderItem.product_id == product_id)
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def create(self, review: Review) -> Review:
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def update(self, review: Review) -> Review:
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete(self, review: Review) -> None:
        self.db.delete(review)
        self.db.commit()
