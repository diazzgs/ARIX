"""
=====================================================================
ARIX BACKEND - Módulo Audit: Router
=====================================================================
Endpoints de solo lectura para que el Super Admin consulte el
historial de acciones administrativas y cambios del sistema.
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.audit.repository import AuditLogRepository
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditLogService
from app.modules.users.models import User

router = APIRouter(tags=["Auditoría"])


def get_audit_service(db: Session = Depends(get_db)) -> AuditLogService:
    return AuditLogService(AuditLogRepository(db))


@router.get(
    "/admin/audit-logs",
    response_model=ApiResponse[PageResponse[AuditLogResponse]],
    summary="Listar historial de auditoría (Super Admin)",
)
def list_audit_logs(
    entity_type: str | None = Query(default=None, description="Filtrar por tipo de entidad, ej. STORE, USER, PRODUCT"),
    action: str | None = Query(default=None, description="Filtrar por acción, ej. STORE_CREATED, USER_BLOCKED"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: AuditLogService = Depends(get_audit_service),
):
    """Lista el historial de acciones administrativas, ordenado de más reciente a más antiguo."""
    result = service.list_logs(entity_type, action, page, size)
    return ApiResponse.ok(result)
