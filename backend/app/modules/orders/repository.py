"""
=====================================================================
ARIX BACKEND - Módulo Orders: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.orders.models import Order, OrderItem, Payment, StoreOrder


class OrderRepository:
    """Operaciones de acceso a datos para órdenes, subórdenes, items y pagos."""

    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------
    # Órdenes principales
    # -----------------------------------------------------------------

    def get_by_id(self, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .options(
                joinedload(Order.store_orders).joinedload(StoreOrder.store),
                joinedload(Order.store_orders).joinedload(StoreOrder.items),
                joinedload(Order.payment),
            )
            .where(Order.id == order_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_order_number(self, order_number: str) -> Order | None:
        stmt = (
            select(Order)
            .options(
                joinedload(Order.store_orders).joinedload(StoreOrder.store),
                joinedload(Order.store_orders).joinedload(StoreOrder.items),
                joinedload(Order.payment),
            )
            .where(Order.order_number == order_number)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_by_customer(self, customer_id: int, offset: int = 0, limit: int = 10) -> tuple[list[Order], int]:
        stmt = (
            select(Order)
            .where(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
        )
        count_stmt = select(func.count(Order.id)).where(Order.customer_id == customer_id)

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())

        return items, total

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.flush()  # asigna el ID sin hacer commit aún (se necesita para order_number)
        return order

    def commit(self) -> None:
        self.db.commit()

    def update(self, order: Order) -> Order:
        self.db.commit()
        self.db.refresh(order)
        return order

    # -----------------------------------------------------------------
    # Subórdenes
    # -----------------------------------------------------------------

    def get_store_order_by_id(self, store_order_id: int) -> StoreOrder | None:
        stmt = (
            select(StoreOrder)
            .options(
                joinedload(StoreOrder.store),
                joinedload(StoreOrder.items),
                joinedload(StoreOrder.order),
            )
            .where(StoreOrder.id == store_order_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_by_store(
        self, store_id: int, status: str | None = None, offset: int = 0, limit: int = 10
    ) -> tuple[list[StoreOrder], int]:
        stmt = (
            select(StoreOrder)
            .options(
                joinedload(StoreOrder.items),
                joinedload(StoreOrder.order).joinedload(Order.customer),
            )
            .where(StoreOrder.store_id == store_id)
        )
        count_stmt = select(func.count(StoreOrder.id)).where(StoreOrder.store_id == store_id)

        if status is not None:
            stmt = stmt.where(StoreOrder.status == status)
            count_stmt = count_stmt.where(StoreOrder.status == status)

        stmt = stmt.order_by(StoreOrder.created_at.desc())

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def count_store_orders_by_status(self, store_id: int, status: str) -> int:
        stmt = select(func.count(StoreOrder.id)).where(
            StoreOrder.store_id == store_id, StoreOrder.status == status
        )
        return self.db.execute(stmt).scalar_one()

    def add_store_order(self, store_order: StoreOrder) -> StoreOrder:
        self.db.add(store_order)
        self.db.flush()
        return store_order

    def add_order_item(self, item: OrderItem) -> OrderItem:
        self.db.add(item)
        self.db.flush()
        return item

    # -----------------------------------------------------------------
    # Pagos
    # -----------------------------------------------------------------

    def add_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        return payment
