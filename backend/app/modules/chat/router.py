"""
=====================================================================
ARIX BACKEND - Módulo Chat: Router
=====================================================================
Expone:
  - Endpoints HTTP para listar conversaciones, iniciar chats y
    enviar mensajes (persisten en BD y notifican por WebSocket).
  - Endpoint WebSocket para recibir mensajes en tiempo real.

Autenticación en WebSocket:
  Se pasa el access token como query param: /ws/chat?token=<jwt>
  (los navegadores no permiten headers personalizados en WebSocket).
=====================================================================
"""

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.common.schemas.response import ApiResponse
from app.core.dependencies import get_current_user
from app.core.security import ACCESS_TOKEN_TYPE, JWTError, decode_token
from app.core.websocket_manager import connection_manager
from app.db.session import SessionLocal, get_db
from app.modules.chat.repository import ChatRepository
from app.modules.chat.schemas import (
    ChatResponse,
    ChatSummaryResponse,
    SendMessageRequest,
    StartChatRequest,
)
from app.modules.chat.service import ChatService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

router = APIRouter(tags=["Chat"])


def get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    return ChatService(ChatRepository(db), UserRepository(db))


# =====================================================================
# HTTP — /api/chats
# =====================================================================

@router.get(
    "/chats",
    response_model=ApiResponse[list[ChatSummaryResponse]],
    summary="Listar mis conversaciones",
)
def list_my_chats(
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Lista todas las conversaciones del usuario autenticado, con el último mensaje y no leídos."""
    result = service.list_my_chats(current_user.id)
    return ApiResponse.ok(result)


@router.post(
    "/chats",
    response_model=ApiResponse[ChatResponse],
    summary="Iniciar o recuperar una conversación",
)
def start_or_get_chat(
    data: StartChatRequest,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """
    Inicia una nueva conversación o retorna la existente entre el
    usuario autenticado y `other_user_id`.

    Combinaciones de roles permitidas: Cliente <-> Admin de Tienda,
    Admin de Tienda <-> Super Admin, Cliente <-> Super Admin.
    """
    result = service.start_or_get_chat(current_user.id, current_user.role.name, data)
    return ApiResponse.ok(result)


@router.get(
    "/chats/{chat_id}",
    response_model=ApiResponse[ChatResponse],
    summary="Obtener una conversación con su historial",
)
def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Obtiene el historial completo de una conversación y marca los mensajes recibidos como leídos."""
    result = service.get_chat(current_user.id, chat_id)
    return ApiResponse.ok(result)


@router.post(
    "/chats/{chat_id}/messages",
    response_model=ApiResponse[ChatResponse],
    summary="Enviar mensaje en una conversación",
)
async def send_message(
    chat_id: int,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """
    Envía un mensaje en una conversación propia.

    Si el destinatario tiene una conexión WebSocket activa, recibe
    el mensaje en tiempo real.
    """
    result = await service.send_message(current_user.id, chat_id, data)
    return ApiResponse.ok(result, message="Mensaje enviado")


# =====================================================================
# WEBSOCKET — /api/ws/chat
# =====================================================================

@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Conexión WebSocket para recibir mensajes de chat en tiempo real.

    Autenticación: se pasa el access token JWT como query param
    (?token=...), ya que los navegadores no permiten enviar headers
    personalizados al abrir un WebSocket.

    El servidor usa esta conexión únicamente para EMITIR mensajes
    nuevos al usuario (push). El envío de mensajes se realiza vía
    el endpoint HTTP POST /api/chats/{chat_id}/messages, que también
    persiste el mensaje en la base de datos.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != ACCESS_TOKEN_TYPE:
            await websocket.close(code=4401)
            return
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        await websocket.close(code=4401)
        return

    # Verificar que el usuario exista y esté activo
    db = SessionLocal()
    try:
        user = UserRepository(db).get_by_id(user_id)
        if user is None or user.status != "ACTIVE":
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await connection_manager.connect(user_id, websocket)
    try:
        while True:
            # Mantiene la conexión abierta. No se procesan mensajes entrantes
            # por este canal; el envío se hace vía HTTP (ver send_message).
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id, websocket)
