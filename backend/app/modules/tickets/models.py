"""
=====================================================================
ARIX BACKEND - Módulo Tickets: Modelos SQLAlchemy
=====================================================================
Mapea las tablas: tickets, ticket_messages
=====================================================================
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.enums.statuses import TicketPriority, TicketStatus
from app.db.base import Base
from app.modules.stores.models import Store  # noqa: F401
from app.modules.users.models import User  # noqa: F401


class Ticket(Base):
    """Tabla: tickets"""

    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ticket_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    store_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("stores.id", ondelete="SET NULL"), nullable=True
    )
    assigned_admin_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=TicketStatus.OPEN.value
    )
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default=TicketPriority.MEDIUM.value
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # --- Relaciones ---
    customer: Mapped["User"] = relationship(foreign_keys=[customer_id])
    store: Mapped["Store | None"] = relationship()
    assigned_admin: Mapped["User | None"] = relationship(foreign_keys=[assigned_admin_id])
    messages: Mapped[list["TicketMessage"]] = relationship(
        back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at"
    )

    def __repr__(self) -> str:
        return f"<Ticket id={self.id} ticket_number={self.ticket_number} status={self.status}>"


class TicketMessage(Base):
    """Tabla: ticket_messages"""

    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # --- Relaciones ---
    ticket: Mapped["Ticket"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<TicketMessage id={self.id} ticket_id={self.ticket_id}>"
