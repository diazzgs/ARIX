"""
=====================================================================
ARIX BACKEND - Módulo Audit: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.audit.models import AuditLog


class AuditLogRepository:
    """Operaciones de acceso a datos para los logs de auditoría."""

    def __init__(self, db: Session):
        self.db = db

    def list_all(
        self,
        entity_type: str | None = None,
        action: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[AuditLog], int]:
        stmt = select(AuditLog).options(joinedload(AuditLog.user))
        count_stmt = select(func.count(AuditLog.id))

        if entity_type is not None:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
            count_stmt = count_stmt.where(AuditLog.entity_type == entity_type)

        if action is not None:
            stmt = stmt.where(AuditLog.action == action)
            count_stmt = count_stmt.where(AuditLog.action == action)

        stmt = stmt.order_by(AuditLog.created_at.desc())

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
