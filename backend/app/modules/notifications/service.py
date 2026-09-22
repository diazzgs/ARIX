"""
=====================================================================
ARIX BACKEND - Módulo Notifications: Service
=====================================================================
"""

from app.common.enums.statuses import NotificationType
from app.common.exceptions.custom_exceptions import ForbiddenException, ResourceNotFoundException
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationResponse


class NotificationService:
    """Casos de uso relacionados a notificaciones de usuario."""

    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    def list_my_notifications(
        self, user_id: int, only_unread: bool, page: int, size: int
    ) -> PageResponse[NotificationResponse]:
        offset = max(page - 1, 0) * size
        notifications, total = self.repository.list_by_user(
            user_id, only_unread=only_unread, offset=offset, limit=size
        )
        items = [NotificationResponse.model_validate(n) for n in notifications]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    def get_unread_count(self, user_id: int) -> int:
        return self.repository.count_unread(user_id)

    def mark_as_read(self, user_id: int, notification_id: int) -> NotificationResponse:
        notification = self.repository.get_by_id(notification_id)
        if notification is None:
            raise ResourceNotFoundException("Notificación no encontrada")

        if notification.user_id != user_id:
            raise ForbiddenException("No puedes modificar la notificación de otro usuario")

        updated = self.repository.mark_as_read(notification)
        return NotificationResponse.model_validate(updated)

    def mark_all_as_read(self, user_id: int) -> None:
        self.repository.mark_all_as_read(user_id)

    def delete_notification(self, user_id: int, notification_id: int) -> None:
        notification = self.repository.get_by_id(notification_id)
        if notification is None:
            raise ResourceNotFoundException("Notificación no encontrada")

        if notification.user_id != user_id:
            raise ForbiddenException("No puedes eliminar la notificación de otro usuario")

        self.repository.delete(notification)

    def delete_all_notifications(self, user_id: int) -> None:
        self.repository.delete_all_by_user(user_id)

    # -----------------------------------------------------------------
    # Helper interno para que otros módulos generen notificaciones
    # -----------------------------------------------------------------

    @staticmethod
    def build_notification(
        user_id: int, title: str, message: str, type_: NotificationType, reference_id: int | None = None
    ) -> Notification:
        """
        Construye (sin persistir) una notificación. Otros services pueden
        usar esto junto con su propia sesión de BD para crear notificaciones
        como parte de una misma transacción (ej. al confirmar una orden).
        """
        return Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type_.value,
            reference_id=reference_id,
            is_read=False,
        )