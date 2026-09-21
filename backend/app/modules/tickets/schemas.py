"""
=====================================================================
ARIX BACKEND - Módulo Tickets: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.common.enums.statuses import TicketPriority, TicketStatus


# =====================================================================
# RESÚMENES
# =====================================================================

class TicketUserSummary(BaseModel):
    """Resumen de un usuario (cliente o admin) dentro de un ticket."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    profile_image_url: str


class TicketStoreSummary(BaseModel):
    """Resumen de la tienda asociada a un ticket, si aplica."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str


# =====================================================================
# MENSAJES
# =====================================================================

class TicketMessageResponse(BaseModel):
    """Mensaje dentro de un ticket."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: TicketUserSummary
    message: str
    created_at: datetime


class CreateTicketMessageRequest(BaseModel):
    """Agregar un mensaje a un ticket existente."""

    message: str = Field(min_length=1, max_length=2000)


# =====================================================================
# TICKETS
# =====================================================================

class TicketResponse(BaseModel):
    """Representación completa de un ticket, incluyendo su historial de mensajes."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_number: str
    customer: TicketUserSummary
    store: TicketStoreSummary | None
    assigned_admin: TicketUserSummary | None
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    messages: list[TicketMessageResponse]
    created_at: datetime
    updated_at: datetime


class TicketSummaryResponse(BaseModel):
    """Versión resumida de un ticket para listados."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_number: str
    customer: TicketUserSummary
    store: TicketStoreSummary | None
    subject: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime


# =====================================================================
# REQUESTS
# =====================================================================

class CreateTicketRequest(BaseModel):
    """Creación de un ticket de soporte por el Cliente."""

    store_id: int | None = Field(
        default=None,
        description="ID de la tienda relacionada al ticket. Si es null, el ticket es dirigido a la plataforma (Super Admin).",
    )
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5, max_length=2000)
    priority: TicketPriority = TicketPriority.MEDIUM


class UpdateTicketStatusRequest(BaseModel):
    """Cambio de estado de un ticket."""

    status: TicketStatus


class AssignTicketRequest(BaseModel):
    """Asignación de un ticket a un administrador (Super Admin)."""

    assigned_admin_id: int
