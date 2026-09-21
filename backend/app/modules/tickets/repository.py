"""
=====================================================================
ARIX BACKEND - Módulo Tickets: Repository
=====================================================================
"""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.modules.tickets.models import Ticket, TicketMessage


class TicketRepository:
    """Operaciones de acceso a datos para tickets y sus mensajes."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, ticket_id: int) -> Ticket | None:
        stmt = (
            select(Ticket)
            .options(
                joinedload(Ticket.customer),
                joinedload(Ticket.store),
                joinedload(Ticket.assigned_admin),
                joinedload(Ticket.messages).joinedload(TicketMessage.sender),
            )
            .where(Ticket.id == ticket_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def exists_by_number(self, ticket_number: str) -> bool:
        stmt = select(Ticket.id).where(Ticket.ticket_number == ticket_number)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def list_by_customer(self, customer_id: int, offset: int = 0, limit: int = 10) -> tuple[list[Ticket], int]:
        stmt = (
            select(Ticket)
            .options(joinedload(Ticket.customer), joinedload(Ticket.store))
            .where(Ticket.customer_id == customer_id)
            .order_by(Ticket.updated_at.desc())
        )
        count_stmt = select(func.count(Ticket.id)).where(Ticket.customer_id == customer_id)

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_for_store_admin(
        self, store_id: int, admin_user_id: int, status: str | None, offset: int = 0, limit: int = 10
    ) -> tuple[list[Ticket], int]:
        """
        Lista tickets visibles para un admin de tienda: aquellos dirigidos
        a su tienda, o asignados directamente a él.
        """
        conditions = [or_(Ticket.store_id == store_id, Ticket.assigned_admin_id == admin_user_id)]
        if status is not None:
            conditions.append(Ticket.status == status)

        stmt = (
            select(Ticket)
            .options(joinedload(Ticket.customer), joinedload(Ticket.store))
            .where(*conditions)
            .order_by(Ticket.updated_at.desc())
        )
        count_stmt = select(func.count(Ticket.id)).where(*conditions)

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_all(self, status: str | None, offset: int = 0, limit: int = 10) -> tuple[list[Ticket], int]:
        """Lista todos los tickets de la plataforma (Super Admin)."""
        stmt = select(Ticket).options(joinedload(Ticket.customer), joinedload(Ticket.store))
        count_stmt = select(func.count(Ticket.id))

        if status is not None:
            stmt = stmt.where(Ticket.status == status)
            count_stmt = count_stmt.where(Ticket.status == status)

        stmt = stmt.order_by(Ticket.updated_at.desc())

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def create(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def update(self, ticket: Ticket) -> Ticket:
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def add_message(self, message: TicketMessage) -> TicketMessage:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
