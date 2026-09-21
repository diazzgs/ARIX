"""
=====================================================================
ARIX BACKEND - Módulo Categories: Modelos SQLAlchemy
=====================================================================
Mapea la tabla: categories (jerárquica, con parent_id opcional)
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Category(Base):
    """Tabla: categories"""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    parent_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    parent: Mapped["Category | None"] = relationship(
        remote_side=[id], back_populates="children"
    )
    children: Mapped[list["Category"]] = relationship(back_populates="parent")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"
