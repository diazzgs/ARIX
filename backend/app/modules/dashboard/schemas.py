"""
=====================================================================
ARIX BACKEND - Módulo Dashboard: Schemas Pydantic
=====================================================================
"""

from decimal import Decimal

from pydantic import BaseModel


class TopStoreStat(BaseModel):
    """Una tienda dentro del ranking de ingresos."""

    id: int
    business_name: str
    revenue: Decimal
    orders_count: int


class MonthlyRevenuePoint(BaseModel):
    """Ingresos y cantidad de órdenes de un mes específico."""

    month: str
    revenue: Decimal
    orders_count: int


class DashboardStatsResponse(BaseModel):
    """Resumen financiero y estadístico general de la plataforma ARIX."""

    # Tiendas
    stores_total: int
    stores_active: int
    stores_suspended: int

    # Usuarios
    users_total: int
    users_clients: int
    users_store_admins: int
    users_super_admins: int

    # Productos
    products_total: int
    products_active: int

    # Órdenes (a nivel de suborden por tienda)
    orders_total: int
    orders_pending: int
    orders_confirmed: int
    orders_preparing: int
    orders_shipped: int
    orders_delivered: int
    orders_cancelled: int

    # Finanzas
    revenue_total: Decimal
    revenue_last_30_days: Decimal
    average_order_value: Decimal

    # Soporte
    tickets_total: int
    tickets_open: int
    tickets_in_progress: int
    tickets_resolved: int
    tickets_closed: int

    # Reseñas
    reviews_total: int
    reviews_reported: int

    # Rankings / series
    top_stores: list[TopStoreStat]
    revenue_by_month: list[MonthlyRevenuePoint]