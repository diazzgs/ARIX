"""
=====================================================================
ARIX BACKEND - Módulo Dashboard: Router
=====================================================================
Expone el endpoint de estadísticas generales de la plataforma para
el Super Admin.
=====================================================================
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.dashboard.repository import DashboardRepository
from app.modules.dashboard.schemas import DashboardStatsResponse
from app.modules.dashboard.service import DashboardService
from app.modules.users.models import User

router = APIRouter(tags=["Dashboard"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))


@router.get(
    "/admin/dashboard/stats",
    response_model=ApiResponse[DashboardStatsResponse],
    summary="Estadísticas generales de la plataforma (Super Admin)",
)
def get_dashboard_stats(
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Retorna un resumen financiero y estadístico de toda la plataforma:
    tiendas, usuarios, productos, órdenes, ingresos, tickets, reseñas
    y el ranking de tiendas con mayores ingresos.
    """
    result = service.get_stats()
    return ApiResponse.ok(result)