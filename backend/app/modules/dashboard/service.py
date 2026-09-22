"""
=====================================================================
ARIX BACKEND - Módulo Dashboard: Service
=====================================================================
Agrega las estadísticas financieras y operativas de toda la
plataforma para el dashboard del Super Admin.
=====================================================================
"""

from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.common.enums.roles import RoleName
from app.common.enums.statuses import (
    OrderStatus,
    ProductStatus,
    ReviewStatus,
    StoreStatus,
    TicketStatus,
)
from app.modules.dashboard.repository import DashboardRepository
from app.modules.dashboard.schemas import (
    DashboardStatsResponse,
    MonthlyRevenuePoint,
    TopStoreStat,
)

_MONTH_NAMES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]


class DashboardService:
    """Casos de uso relacionados al dashboard administrativo (Super Admin)."""

    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def get_stats(self) -> DashboardStatsResponse:
        users_by_role = self.repository.count_users_by_role()
        stores_by_status = self.repository.count_stores_by_status()
        products_by_status = self.repository.count_products_by_status()
        orders_by_status = self.repository.count_store_orders_by_status()
        tickets_by_status = self.repository.count_tickets_by_status()
        reviews_by_status = self.repository.count_reviews_by_status()
        order_rows = self.repository.order_totals()
        top_stores_rows = self.repository.top_stores_by_revenue(limit=5)

        orders_total = len(order_rows)
        revenue_total = sum((amount for _, amount in order_rows), start=Decimal("0.00"))
        average_order_value = (
            (revenue_total / orders_total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if orders_total
            else Decimal("0.00")
        )

        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        revenue_last_30_days = sum(
            (amount for created_at, amount in order_rows if created_at and created_at >= thirty_days_ago),
            start=Decimal("0.00"),
        )

        return DashboardStatsResponse(
            stores_total=sum(stores_by_status.values()),
            stores_active=stores_by_status.get(StoreStatus.ACTIVE.value, 0),
            stores_suspended=stores_by_status.get(StoreStatus.SUSPENDED.value, 0),
            users_total=sum(users_by_role.values()),
            users_clients=users_by_role.get(RoleName.CLIENT.value, 0),
            users_store_admins=users_by_role.get(RoleName.STORE_ADMIN.value, 0),
            users_super_admins=users_by_role.get(RoleName.SUPER_ADMIN.value, 0),
            products_total=sum(products_by_status.values()),
            products_active=products_by_status.get(ProductStatus.ACTIVE.value, 0),
            orders_total=orders_total,
            orders_pending=orders_by_status.get(OrderStatus.PENDING.value, 0),
            orders_confirmed=orders_by_status.get(OrderStatus.CONFIRMED.value, 0),
            orders_preparing=orders_by_status.get(OrderStatus.PREPARING.value, 0),
            orders_shipped=orders_by_status.get(OrderStatus.SHIPPED.value, 0),
            orders_delivered=orders_by_status.get(OrderStatus.DELIVERED.value, 0),
            orders_cancelled=orders_by_status.get(OrderStatus.CANCELLED.value, 0),
            revenue_total=revenue_total,
            revenue_last_30_days=revenue_last_30_days,
            average_order_value=average_order_value,
            tickets_total=sum(tickets_by_status.values()),
            tickets_open=tickets_by_status.get(TicketStatus.OPEN.value, 0),
            tickets_in_progress=tickets_by_status.get(TicketStatus.IN_PROGRESS.value, 0),
            tickets_resolved=tickets_by_status.get(TicketStatus.RESOLVED.value, 0),
            tickets_closed=tickets_by_status.get(TicketStatus.CLOSED.value, 0),
            reviews_total=sum(reviews_by_status.values()),
            reviews_reported=reviews_by_status.get(ReviewStatus.REPORTED.value, 0),
            top_stores=[
                TopStoreStat(
                    id=store_id,
                    business_name=business_name,
                    revenue=Decimal(revenue or 0),
                    orders_count=count,
                )
                for store_id, business_name, revenue, count in top_stores_rows
            ],
            revenue_by_month=self._group_revenue_by_month(order_rows),
        )

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _group_revenue_by_month(self, order_rows: list[tuple[datetime, Decimal]]) -> list[MonthlyRevenuePoint]:
        """Agrupa los ingresos por mes de los últimos 6 meses (incluyendo meses sin órdenes)."""
        now = datetime.utcnow()
        months: list[tuple[int, int]] = []
        year, month = now.year, now.month
        for _ in range(6):
            months.append((year, month))
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        months.reverse()

        revenue_buckets: dict[tuple[int, int], Decimal] = {m: Decimal("0.00") for m in months}
        count_buckets: dict[tuple[int, int], int] = {m: 0 for m in months}

        for created_at, amount in order_rows:
            if created_at is None:
                continue
            key = (created_at.year, created_at.month)
            if key in revenue_buckets:
                revenue_buckets[key] += amount
                count_buckets[key] += 1

        return [
            MonthlyRevenuePoint(
                month=f"{_MONTH_NAMES[m - 1]} {y}",
                revenue=revenue_buckets[(y, m)],
                orders_count=count_buckets[(y, m)],
            )
            for (y, m) in months
        ]