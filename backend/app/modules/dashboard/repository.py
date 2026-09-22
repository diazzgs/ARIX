"""
=====================================================================
ARIX BACKEND - Módulo Dashboard: Repository
=====================================================================
Consultas agregadas (conteos, sumas) sobre varias tablas de la
plataforma para alimentar el dashboard del Super Admin.
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.orders.models import Order, StoreOrder
from app.modules.products.models import Product
from app.modules.reviews.models import Review
from app.modules.stores.models import Store
from app.modules.tickets.models import Ticket
from app.modules.users.models import Role, User


class DashboardRepository:
    """Operaciones de acceso a datos agregadas para el dashboard administrativo."""

    def __init__(self, db: Session):
        self.db = db

    def count_users_by_role(self) -> dict[str, int]:
        stmt = (
            select(Role.name, func.count(User.id))
            .select_from(User)
            .join(Role, Role.id == User.role_id)
            .group_by(Role.name)
        )
        return {name: count for name, count in self.db.execute(stmt).all()}

    def count_stores_by_status(self) -> dict[str, int]:
        stmt = select(Store.status, func.count(Store.id)).group_by(Store.status)
        return {status: count for status, count in self.db.execute(stmt).all()}

    def count_products_by_status(self) -> dict[str, int]:
        stmt = select(Product.status, func.count(Product.id)).group_by(Product.status)
        return {status: count for status, count in self.db.execute(stmt).all()}

    def count_store_orders_by_status(self) -> dict[str, int]:
        stmt = select(StoreOrder.status, func.count(StoreOrder.id)).group_by(StoreOrder.status)
        return {status: count for status, count in self.db.execute(stmt).all()}

    def count_tickets_by_status(self) -> dict[str, int]:
        stmt = select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)
        return {status: count for status, count in self.db.execute(stmt).all()}

    def count_reviews_by_status(self) -> dict[str, int]:
        stmt = select(Review.status, func.count(Review.id)).group_by(Review.status)
        return {status: count for status, count in self.db.execute(stmt).all()}

    def order_totals(self) -> list[tuple[datetime, Decimal]]:
        """Fecha de creación y monto total de cada orden, para agregaciones en memoria."""
        stmt = select(Order.created_at, Order.total_amount)
        return [(row[0], row[1]) for row in self.db.execute(stmt).all()]

    def top_stores_by_revenue(self, limit: int = 5) -> list[tuple[int, str, Decimal, int]]:
        stmt = (
            select(
                Store.id,
                Store.business_name,
                func.coalesce(func.sum(StoreOrder.total), 0),
                func.count(StoreOrder.id),
            )
            .join(StoreOrder, StoreOrder.store_id == Store.id)
            .group_by(Store.id, Store.business_name)
            .order_by(func.sum(StoreOrder.total).desc())
            .limit(limit)
        )
        return [(row[0], row[1], row[2], row[3]) for row in self.db.execute(stmt).all()]