"""
=====================================================================
ARIX BACKEND - Módulo Users: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: roles, users, password_reset_tokens
(definidas en arix_schema.sql)
=====================================================================
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import UserStatus
from app.db.base import Base


class Role(Base):
    """Tabla: roles"""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    users: Mapped[list["User"]] = relationship(back_populates="role")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name}>"


class User(Base):
    """Tabla: users"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile_image_url: Mapped[str] = mapped_column(
        String(500), nullable=False, server_default="/images/default-avatar.png"
    )

    role_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("roles.id"), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=UserStatus.ACTIVE.value
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    role: Mapped["Role"] = relationship(back_populates="users")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


class PasswordResetToken(Base):
    """Tabla: password_reset_tokens"""

    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")

    def __repr__(self) -> str:
        return f"<PasswordResetToken id={self.id} user_id={self.user_id}>"
