"""
=====================================================================
ARIX BACKEND - Módulo Stores: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: stores, store_profiles
(definidas en arix_schema.sql)
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import StoreStatus
from app.db.base import Base
from app.modules.users.models import User


class Store(Base):
    """Tabla: stores"""

    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact_address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=StoreStatus.ACTIVE.value
    )

    admin_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    admin: Mapped["User | None"] = relationship(foreign_keys=[admin_user_id])
    profile: Mapped["StoreProfile"] = relationship(
        back_populates="store", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Store id={self.id} business_name={self.business_name}>"


class StoreProfile(Base):
    """Tabla: store_profiles"""

    __tablename__ = "store_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    store_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    about: Mapped[str | None] = mapped_column(Text, nullable=True)
    social_facebook: Mapped[str | None] = mapped_column(String(255), nullable=True)
    social_instagram: Mapped[str | None] = mapped_column(String(255), nullable=True)
    social_website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    store: Mapped["Store"] = relationship(back_populates="profile")

    def __repr__(self) -> str:
        return f"<StoreProfile id={self.id} store_id={self.store_id}>"
