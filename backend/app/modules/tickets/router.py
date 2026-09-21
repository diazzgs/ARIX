"""
=====================================================================
ARIX BACKEND - Módulo Tickets: Router
=====================================================================
Expone los endpoints de:
  - Creación e historial de tickets (Cliente)
  - Gestión de tickets de la tienda (Admin de Tienda)
  - Supervisión, asignación y listado global (Super Admin)
  - Mensajería compartida (cualquier rol con acceso al ticket)
=====================================================================
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.enums.statuses import TicketStatus
from app.common.schemas.pagination import PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole, get_current_user
from app.db.session import get_db
from app.modules.stores.repository import StoreRepository
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.schemas import (
    AssignTicketRequest,
    CreateTicketMessageRequest,
    CreateTicketRequest,
    TicketResponse,
    TicketSummaryResponse,
    UpdateTicketStatusRequest,
)
from app.modules.tickets.service import TicketService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

router = APIRouter(tags=["Tickets de Soporte"])


def get_ticket_service(db: Session = Depends(get_db)) -> TicketService:
    return TicketService(TicketRepository(db), StoreRepository(db), UserRepository(db))


# =====================================================================
# CLIENTE — /api/tickets
# =====================================================================

@router.post(
    "/tickets",
    response_model=ApiResponse[TicketResponse],
    summary="Crear ticket de soporte (Cliente)",
)
def create_ticket(
    data: CreateTicketRequest,
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: TicketService = Depends(get_ticket_service),
):
    """
    Crea un ticket de soporte.

    Si se especifica `store_id`, el ticket es dirigido a esa tienda.
    Si no, queda dirigido a la plataforma (Super Admin).
    """
    result = service.create_ticket(current_user.id, data)
    return ApiResponse.ok(result, message="Ticket creado exitosamente")


@router.get(
    "/tickets",
    response_model=ApiResponse[PageResponse[TicketSummaryResponse]],
    summary="Listar mis tickets (Cliente)",
)
def list_my_tickets(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.CLIENT)),
    service: TicketService = Depends(get_ticket_service),
):
    """Lista el historial de tickets del cliente autenticado."""
    result = service.list_my_tickets(current_user.id, page, size)
    return ApiResponse.ok(result)


# =====================================================================
# ADMIN DE TIENDA — /api/store/tickets
# =====================================================================

@router.get(
    "/store/tickets",
    response_model=ApiResponse[PageResponse[TicketSummaryResponse]],
    summary="Listar tickets de mi tienda (Admin de Tienda)",
)
def list_store_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: TicketService = Depends(get_ticket_service),
):
    """Lista tickets dirigidos a la tienda del admin, o asignados directamente a él."""
    result = service.list_store_tickets(current_user.id, status_filter, page, size)
    return ApiResponse.ok(result)


# =====================================================================
# SUPER ADMIN — /api/admin/tickets
# =====================================================================

@router.get(
    "/admin/tickets",
    response_model=ApiResponse[PageResponse[TicketSummaryResponse]],
    summary="Listar todos los tickets (Super Admin)",
)
def list_all_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: TicketService = Depends(get_ticket_service),
):
    """Lista todos los tickets de la plataforma, opcionalmente filtrados por estado."""
    result = service.list_all_tickets(status_filter, page, size)
    return ApiResponse.ok(result)


@router.put(
    "/admin/tickets/{ticket_id}/assign",
    response_model=ApiResponse[TicketResponse],
    summary="Asignar ticket a un administrador (Super Admin)",
)
def assign_ticket(
    ticket_id: int,
    data: AssignTicketRequest,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: TicketService = Depends(get_ticket_service),
):
    """Asigna un ticket a un administrador de tienda o al propio Super Admin."""
    result = service.assign_ticket(ticket_id, data)
    return ApiResponse.ok(result, message="Ticket asignado correctamente")


# =====================================================================
# COMPARTIDO — /api/tickets/{ticket_id} (Cliente, Admin de Tienda, Super Admin)
# =====================================================================

@router.get(
    "/tickets/{ticket_id}",
    response_model=ApiResponse[TicketResponse],
    summary="Obtener detalle de un ticket (acceso según rol)",
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service),
):
    """
    Obtiene el detalle completo de un ticket, incluyendo su historial de mensajes.

    Acceso permitido a: el cliente propietario, el admin de la tienda
    destino (o asignado), y el Super Admin.
    """
    result = service.get_ticket(current_user.id, current_user.role.name, ticket_id)
    return ApiResponse.ok(result)


@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=ApiResponse[TicketResponse],
    summary="Enviar mensaje en un ticket (acceso según rol)",
)
def add_ticket_message(
    ticket_id: int,
    data: CreateTicketMessageRequest,
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service),
):
    """
    Agrega un mensaje al historial de un ticket.

    Si un administrador responde un ticket en estado OPEN, este pasa
    automáticamente a IN_PROGRESS.
    """
    result = service.add_message(current_user.id, current_user.role.name, ticket_id, data)
    return ApiResponse.ok(result, message="Mensaje enviado correctamente")


@router.put(
    "/tickets/{ticket_id}/status",
    response_model=ApiResponse[TicketResponse],
    summary="Cambiar estado de un ticket (Admin de Tienda / Super Admin)",
)
def update_ticket_status(
    ticket_id: int,
    data: UpdateTicketStatusRequest,
    current_user: User = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service),
):
    """Cambia el estado de un ticket (OPEN, IN_PROGRESS, RESOLVED, CLOSED)."""
    result = service.update_ticket_status(current_user.id, current_user.role.name, ticket_id, data)
    return ApiResponse.ok(result, message="Estado del ticket actualizado correctamente")
