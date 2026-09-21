"""
=====================================================================
ARIX BACKEND - Utilidades: Eventos del sistema (auditoría + notificaciones)
=====================================================================
Punto único para que cualquier router registre una entrada de
auditoría y/o cree una notificación tras una acción exitosa,
reutilizando la misma sesión de base de datos de la request.

Uso típico desde un router:

    from app.utils.events import record_audit_log, notify_user

    record_audit_log(
        db, user_id=current_user.id, action="STORE_CREATED",
        entity_type="STORE", entity_id=store.id,
        details={"business_name": store.business_name},
    )
    notify_user(
        db, user_id=store.admin_user_id, title="Tienda creada",
        message="Se te ha asignado la tienda X", type_=NotificationType.STORE,
        reference_id=store.id,
    )
=====================================================================
"""

from typing import Any

from sqlalchemy.orm import Session

from app.common.enums.statuses import NotificationType
from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditLogRepository
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository


def record_audit_log(
    db: Session,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Registra una entrada de auditoría. No lanza excepciones de negocio."""
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
    )
    AuditLogRepository(db).create(log)


def notify_user(
    db: Session,
    user_id: int | None,
    title: str,
    message: str,
    type_: NotificationType,
    reference_id: int | None = None,
) -> None:
    """
    Crea una notificación para un usuario. Si user_id es None
    (ej. tienda sin administrador asignado aún), no hace nada.
    """
    if user_id is None:
        return

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type_.value,
        reference_id=reference_id,
        is_read=False,
    )
    NotificationRepository(db).create(notification)
