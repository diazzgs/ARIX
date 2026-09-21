"""
=====================================================================
ARIX BACKEND - Módulo Notifications: Router
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationResponse, UnreadCountResponse
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User

router = APIRouter(tags=["Notificaciones"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(NotificationRepository(db))


@router.get(
    "/notifications",
    response_model=ApiResponse[PageResponse[NotificationResponse]],
    summary="Listar mis notificaciones",
)
def list_my_notifications(
    only_unread: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Lista las notificaciones del usuario autenticado, de más reciente a más antigua."""
    result = service.list_my_notifications(current_user.id, only_unread, page, size)
    return ApiResponse.ok(result)


@router.get(
    "/notifications/unread-count",
    response_model=ApiResponse[UnreadCountResponse],
    summary="Obtener cantidad de notificaciones no leídas",
)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Retorna el número de notificaciones no leídas (útil para un badge en el frontend)."""
    count = service.get_unread_count(current_user.id)
    return ApiResponse.ok(UnreadCountResponse(unread_count=count))


@router.put(
    "/notifications/{notification_id}/read",
    response_model=ApiResponse[NotificationResponse],
    summary="Marcar notificación como leída",
)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Marca una notificación propia como leída."""
    result = service.mark_as_read(current_user.id, notification_id)
    return ApiResponse.ok(result)


@router.put(
    "/notifications/read-all",
    response_model=ApiResponse[dict],
    summary="Marcar todas mis notificaciones como leídas",
)
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Marca todas las notificaciones del usuario autenticado como leídas."""
    service.mark_all_as_read(current_user.id)
    return ApiResponse.ok({}, message="Notificaciones marcadas como leídas")


@router.delete(
    "/notifications/{notification_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar notificación",
)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Elimina una notificación propia."""
    service.delete_notification(current_user.id, notification_id)
    return ApiResponse.ok({}, message="Notificación eliminada")
