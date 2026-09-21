"""
=====================================================================
ARIX BACKEND - Módulo Audit: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: audit_logs
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.modules.users.models import User  # noqa: F401


class AuditLog(Base):
    """Tabla: audit_logs"""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    user: Mapped["User | None"] = relationship()

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} entity_type={self.entity_type}>"
