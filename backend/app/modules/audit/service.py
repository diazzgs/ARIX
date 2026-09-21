"""
=====================================================================
ARIX BACKEND - Módulo Audit: Service
=====================================================================
"""

from typing import Any

from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditLogRepository
from app.modules.audit.schemas import AuditLogResponse


class AuditLogService:
    """Casos de uso relacionados a la auditoría del sistema."""

    def __init__(self, repository: AuditLogRepository):
        self.repository = repository

    def list_logs(
        self, entity_type: str | None, action: str | None, page: int, size: int
    ) -> PageResponse[AuditLogResponse]:
        offset = max(page - 1, 0) * size
        logs, total = self.repository.list_all(entity_type, action, offset=offset, limit=size)
        items = [AuditLogResponse.model_validate(log) for log in logs]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    def record(
        self,
        user_id: int | None,
        action: str,
        entity_type: str,
        entity_id: int | None = None,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> None:
        """
        Registra una entrada de auditoría.

        Pensado para ser invocado desde otros services (ej. al crear
        una tienda, bloquear un usuario, etc.) pasando el repositorio
        de la misma sesión de BD activa.
        """
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
        )
        self.repository.create(log)
