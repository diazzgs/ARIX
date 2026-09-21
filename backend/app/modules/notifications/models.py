"""
=====================================================================
ARIX BACKEND - Módulo Notifications: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: notifications
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import NotificationType
from app.db.base import Base
from app.modules.users.models import User  # noqa: F401


class Notification(Base):
    """Tabla: notifications"""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)

    type: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=NotificationType.SYSTEM.value
    )
    reference_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} type={self.type}>"
