"""
=====================================================================
ARIX BACKEND - Módulo Chat: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: chats, messages
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.modules.stores.models import Store  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Chat(Base):
    """Tabla: chats — Conversación entre dos usuarios."""

    __tablename__ = "chats"
    __table_args__ = (
        UniqueConstraint("user_one_id", "user_two_id", "store_id", name="uq_chats_pair"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_one_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user_two_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    store_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    user_one: Mapped["User"] = relationship(foreign_keys=[user_one_id])
    user_two: Mapped["User"] = relationship(foreign_keys=[user_two_id])
    store: Mapped["Store | None"] = relationship()
    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at"
    )

    def __repr__(self) -> str:
        return f"<Chat id={self.id} user_one_id={self.user_one_id} user_two_id={self.user_two_id}>"


class Message(Base):
    """Tabla: messages"""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    chat_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    chat: Mapped["Chat"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<Message id={self.id} chat_id={self.chat_id} sender_id={self.sender_id}>"
