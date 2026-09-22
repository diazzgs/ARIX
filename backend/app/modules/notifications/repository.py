"""
=====================================================================
ARIX BACKEND - Módulo Notifications: Repository
=====================================================================
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


class NotificationRepository:
    """Operaciones de acceso a datos para notificaciones."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, notification_id: int) -> Notification | None:
        stmt = select(Notification).where(Notification.id == notification_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_user(
        self, user_id: int, only_unread: bool = False, offset: int = 0, limit: int = 10
    ) -> tuple[list[Notification], int]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        count_stmt = select(func.count(Notification.id)).where(Notification.user_id == user_id)

        if only_unread:
            stmt = stmt.where(Notification.is_read.is_(False))
            count_stmt = count_stmt.where(Notification.is_read.is_(False))

        stmt = stmt.order_by(Notification.created_at.desc())

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())

        return items, total

    def count_unread(self, user_id: int) -> int:
        stmt = select(func.count(Notification.id)).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
        return self.db.execute(stmt).scalar_one()

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_as_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> None:
        stmt = select(Notification).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
        for notification in self.db.execute(stmt).scalars().all():
            notification.is_read = True
        self.db.commit()

    def delete(self, notification: Notification) -> None:
        self.db.delete(notification)
        self.db.commit()

    def delete_all_by_user(self, user_id: int) -> None:
        stmt = select(Notification).where(Notification.user_id == user_id)
        for notification in self.db.execute(stmt).scalars().all():
            self.db.delete(notification)
        self.db.commit()