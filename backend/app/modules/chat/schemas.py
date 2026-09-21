"""
=====================================================================
ARIX BACKEND - Módulo Chat: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatUserSummary(BaseModel):
    """Resumen de un participante del chat."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    profile_image_url: str


class ChatStoreSummary(BaseModel):
    """Resumen de la tienda asociada al chat, si aplica."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str


class MessageResponse(BaseModel):
    """Mensaje individual dentro de un chat."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: ChatUserSummary
    content: str
    is_read: bool
    created_at: datetime


class ChatResponse(BaseModel):
    """Conversación completa, con su historial de mensajes."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    other_user: ChatUserSummary
    store: ChatStoreSummary | None
    messages: list[MessageResponse]
    created_at: datetime
    updated_at: datetime


class ChatSummaryResponse(BaseModel):
    """Versión resumida de un chat para listados (bandeja de conversaciones)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    other_user: ChatUserSummary
    store: ChatStoreSummary | None
    last_message: str | None
    unread_count: int
    updated_at: datetime


# =====================================================================
# REQUESTS
# =====================================================================

class StartChatRequest(BaseModel):
    """Inicia (o reutiliza) una conversación con otro usuario."""

    other_user_id: int
    store_id: int | None = Field(
        default=None,
        description="Contexto de tienda del chat (ej. cliente <-> admin de tienda)",
    )


class SendMessageRequest(BaseModel):
    """Envía un mensaje dentro de un chat."""

    content: str = Field(min_length=1, max_length=2000)


# =====================================================================
# WEBSOCKET — eventos
# =====================================================================

class WebSocketIncomingMessage(BaseModel):
    """Mensaje entrante por WebSocket: el cliente envía un nuevo mensaje de chat."""

    type: str = Field(default="message", description="Tipo de evento (actualmente solo 'message')")
    chat_id: int
    content: str = Field(min_length=1, max_length=2000)


class WebSocketOutgoingMessage(BaseModel):
    """Mensaje saliente por WebSocket: notifica un nuevo mensaje a los participantes."""

    type: str = "message"
    chat_id: int
    message: MessageResponse
