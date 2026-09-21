"""
=====================================================================
ARIX BACKEND - Módulo Tickets: Service
=====================================================================
Gestiona el ciclo de vida de los tickets de soporte:
  - El Cliente crea tickets (dirigidos a una tienda o a la plataforma).
  - El Admin de Tienda responde tickets de su tienda o asignados a él.
  - El Super Admin supervisa, asigna y puede responder cualquier ticket.
=====================================================================
"""

from app.common.enums.roles import RoleName
from app.common.enums.statuses import NotificationType
from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.stores.repository import StoreRepository
from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.schemas import (
    AssignTicketRequest,
    CreateTicketMessageRequest,
    CreateTicketRequest,
    TicketResponse,
    TicketSummaryResponse,
    UpdateTicketStatusRequest,
)
from app.modules.users.repository import UserRepository
from app.utils.events import notify_user, record_audit_log

TICKET_NUMBER_PREFIX = "TCK"


class TicketService:
    """Casos de uso relacionados a tickets de soporte."""

    def __init__(
        self,
        repository: TicketRepository,
        store_repository: StoreRepository,
        user_repository: UserRepository,
    ):
        self.repository = repository
        self.store_repository = store_repository
        self.user_repository = user_repository

    # -----------------------------------------------------------------
    # Cliente
    # -----------------------------------------------------------------

    def create_ticket(self, customer_id: int, data: CreateTicketRequest) -> TicketResponse:
        if data.store_id is not None:
            store = self.store_repository.get_by_id(data.store_id)
            if store is None:
                raise ResourceNotFoundException("La tienda especificada no existe")

        ticket = Ticket(
            ticket_number="PENDING",
            customer_id=customer_id,
            store_id=data.store_id,
            subject=data.subject,
            description=data.description,
            status="OPEN",
            priority=data.priority.value,
        )
        created = self.repository.create(ticket)

        ticket_number = f"{TICKET_NUMBER_PREFIX}-{created.id:04d}"
        created.ticket_number = ticket_number

        # El primer mensaje del ticket es la descripción inicial del cliente
        first_message = TicketMessage(
            ticket_id=created.id,
            sender_id=customer_id,
            message=data.description,
        )
        self.repository.add_message(first_message)
        self.repository.update(created)

        refreshed = self.repository.get_by_id(created.id)
        return TicketResponse.model_validate(refreshed)

    def list_my_tickets(self, customer_id: int, page: int, size: int) -> PageResponse[TicketSummaryResponse]:
        offset = max(page - 1, 0) * size
        tickets, total = self.repository.list_by_customer(customer_id, offset=offset, limit=size)
        items = [TicketSummaryResponse.model_validate(t) for t in tickets]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    # -----------------------------------------------------------------
    # Lectura compartida (cualquier rol con acceso al ticket)
    # -----------------------------------------------------------------

    def get_ticket(self, user_id: int, role: str, ticket_id: int) -> TicketResponse:
        ticket = self._get_or_404(ticket_id)
        self._ensure_access(user_id, role, ticket)
        return TicketResponse.model_validate(ticket)

    def add_message(self, user_id: int, role: str, ticket_id: int, data: CreateTicketMessageRequest) -> TicketResponse:
        ticket = self._get_or_404(ticket_id)
        self._ensure_access(user_id, role, ticket)

        if ticket.status == "CLOSED":
            raise BadRequestException("No se pueden agregar mensajes a un ticket cerrado")

        message = TicketMessage(ticket_id=ticket.id, sender_id=user_id, message=data.message)
        self.repository.add_message(message)

        # Si un admin responde un ticket abierto, pasa automáticamente a "en proceso"
        if role in (RoleName.STORE_ADMIN.value, RoleName.SUPER_ADMIN.value) and ticket.status == "OPEN":
            ticket.status = "IN_PROGRESS"

        self.repository.update(ticket)

        db = self.repository.db
        if role == RoleName.CLIENT.value:
            # El cliente respondió: notificar al admin asignado (si existe)
            if ticket.assigned_admin_id is not None:
                notify_user(
                    db,
                    user_id=ticket.assigned_admin_id,
                    title="Nuevo mensaje en ticket",
                    message=f"El cliente respondió en el ticket {ticket.ticket_number}.",
                    type_=NotificationType.TICKET,
                    reference_id=ticket.id,
                )
        else:
            # Un admin respondió: notificar al cliente
            notify_user(
                db,
                user_id=ticket.customer_id,
                title="Respuesta a tu ticket",
                message=f"Tienes una nueva respuesta en el ticket {ticket.ticket_number}.",
                type_=NotificationType.TICKET,
                reference_id=ticket.id,
            )

        refreshed = self.repository.get_by_id(ticket.id)
        return TicketResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Admin de Tienda
    # -----------------------------------------------------------------

    def list_store_tickets(
        self, admin_user_id: int, status, page: int, size: int
    ) -> PageResponse[TicketSummaryResponse]:
        store = self.store_repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")

        offset = max(page - 1, 0) * size
        status_value = status.value if status else None
        tickets, total = self.repository.list_for_store_admin(
            store.id, admin_user_id, status_value, offset=offset, limit=size
        )
        items = [TicketSummaryResponse.model_validate(t) for t in tickets]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    # -----------------------------------------------------------------
    # Estado y asignación
    # -----------------------------------------------------------------

    def update_ticket_status(self, user_id: int, role: str, ticket_id: int, data: UpdateTicketStatusRequest) -> TicketResponse:
        ticket = self._get_or_404(ticket_id)
        self._ensure_access(user_id, role, ticket)

        if role == RoleName.CLIENT.value:
            raise ForbiddenException("Los clientes no pueden cambiar el estado de un ticket")

        ticket.status = data.status.value
        updated = self.repository.update(ticket)

        refreshed = self.repository.get_by_id(updated.id)
        return TicketResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Super Admin
    # -----------------------------------------------------------------

    def list_all_tickets(self, status, page: int, size: int) -> PageResponse[TicketSummaryResponse]:
        offset = max(page - 1, 0) * size
        status_value = status.value if status else None
        tickets, total = self.repository.list_all(status_value, offset=offset, limit=size)
        items = [TicketSummaryResponse.model_validate(t) for t in tickets]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    def assign_ticket(self, ticket_id: int, data: AssignTicketRequest) -> TicketResponse:
        ticket = self._get_or_404(ticket_id)

        admin = self.user_repository.get_by_id(data.assigned_admin_id)
        if admin is None:
            raise ResourceNotFoundException("El administrador especificado no existe")

        if admin.role.name not in (RoleName.STORE_ADMIN.value, RoleName.SUPER_ADMIN.value):
            raise BadRequestException("El ticket solo puede asignarse a un administrador")

        ticket.assigned_admin_id = data.assigned_admin_id
        if ticket.status == "OPEN":
            ticket.status = "IN_PROGRESS"

        updated = self.repository.update(ticket)

        db = self.repository.db
        record_audit_log(
            db,
            user_id=None,
            action="TICKET_ASSIGNED",
            entity_type="TICKET",
            entity_id=ticket.id,
            details={"assigned_admin_id": data.assigned_admin_id},
        )
        notify_user(
            db,
            user_id=data.assigned_admin_id,
            title="Se te ha asignado un ticket",
            message=f"Se te asignó el ticket {ticket.ticket_number}: {ticket.subject}.",
            type_=NotificationType.TICKET,
            reference_id=ticket.id,
        )

        refreshed = self.repository.get_by_id(updated.id)
        return TicketResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_or_404(self, ticket_id: int) -> Ticket:
        ticket = self.repository.get_by_id(ticket_id)
        if ticket is None:
            raise ResourceNotFoundException("Ticket no encontrado")
        return ticket

    def _ensure_access(self, user_id: int, role: str, ticket: Ticket) -> None:
        """Valida que el usuario tenga permiso para ver/responder este ticket."""
        if role == RoleName.SUPER_ADMIN.value:
            return

        if role == RoleName.CLIENT.value:
            if ticket.customer_id != user_id:
                raise ForbiddenException("No tienes acceso a este ticket")
            return

        if role == RoleName.STORE_ADMIN.value:
            store = self.store_repository.get_by_admin_user_id(user_id)
            is_own_store_ticket = store is not None and ticket.store_id == store.id
            is_assigned_to_me = ticket.assigned_admin_id == user_id

            if not (is_own_store_ticket or is_assigned_to_me):
                raise ForbiddenException("No tienes acceso a este ticket")
            return

        raise ForbiddenException("No tienes acceso a este ticket")
