"""
=====================================================================
ARIX BACKEND - Módulo Notifications: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.common.enums.statuses import NotificationType


class NotificationResponse(BaseModel):
    """Representación de una notificación."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    type: NotificationType
    reference_id: int | None
    is_read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    """Conteo de notificaciones no leídas."""

    unread_count: int
