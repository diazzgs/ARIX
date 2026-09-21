"""
=====================================================================
ARIX BACKEND - Módulo Chat: Service
=====================================================================
Gestiona la creación/recuperación de conversaciones y el envío de
mensajes, incluyendo el push en tiempo real vía WebSocket al
destinatario si está conectado.
=====================================================================
"""

from app.common.enums.roles import RoleName
from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.core.websocket_manager import connection_manager
from app.modules.chat.models import Chat, Message
from app.modules.chat.repository import ChatRepository
from app.modules.chat.schemas import (
    ChatResponse,
    ChatSummaryResponse,
    MessageResponse,
    SendMessageRequest,
    StartChatRequest,
    WebSocketOutgoingMessage,
)
from app.modules.users.repository import UserRepository


class ChatService:
    """Casos de uso relacionados a chats y mensajería."""

    def __init__(self, repository: ChatRepository, user_repository: UserRepository):
        self.repository = repository
        self.user_repository = user_repository

    # -----------------------------------------------------------------
    # Iniciar / obtener conversación
    # -----------------------------------------------------------------

    def start_or_get_chat(self, current_user_id: int, current_role: str, data: StartChatRequest) -> ChatResponse:
        if data.other_user_id == current_user_id:
            raise BadRequestException("No puedes iniciar una conversación contigo mismo")

        other_user = self.user_repository.get_by_id(data.other_user_id)
        if other_user is None:
            raise ResourceNotFoundException("El usuario destinatario no existe")

        self._validate_chat_roles(current_role, other_user.role.name)

        existing = self.repository.get_between_users(current_user_id, data.other_user_id, data.store_id)
        if existing is not None:
            return self._to_chat_response(existing, current_user_id)

        chat = Chat(
            user_one_id=current_user_id,
            user_two_id=data.other_user_id,
            store_id=data.store_id,
        )
        created = self.repository.create(chat)

        refreshed = self.repository.get_by_id(created.id)
        return self._to_chat_response(refreshed, current_user_id)

    # -----------------------------------------------------------------
    # Listado / detalle
    # -----------------------------------------------------------------

    def list_my_chats(self, user_id: int) -> list[ChatSummaryResponse]:
        chats = self.repository.list_for_user(user_id)
        summaries = []
        for chat in chats:
            other_user = chat.user_two if chat.user_one_id == user_id else chat.user_one
            last_message = chat.messages[-1].content if chat.messages else None
            unread = self.repository.count_unread(chat.id, user_id)

            summaries.append(
                ChatSummaryResponse.model_validate(
                    {
                        "id": chat.id,
                        "other_user": other_user,
                        "store": chat.store,
                        "last_message": last_message,
                        "unread_count": unread,
                        "updated_at": chat.updated_at,
                    }
                )
            )
        return summaries

    def get_chat(self, user_id: int, chat_id: int) -> ChatResponse:
        chat = self._get_or_404(chat_id)
        self._ensure_participant(user_id, chat)

        # Al abrir la conversación, marcar como leídos los mensajes recibidos
        self.repository.mark_messages_as_read(chat_id, user_id)

        refreshed = self.repository.get_by_id(chat_id)
        return self._to_chat_response(refreshed, user_id)

    # -----------------------------------------------------------------
    # Envío de mensajes (HTTP, con push WebSocket al destinatario)
    # -----------------------------------------------------------------

    async def send_message(self, sender_id: int, chat_id: int, data: SendMessageRequest) -> ChatResponse:
        chat = self._get_or_404(chat_id)
        self._ensure_participant(sender_id, chat)

        message = Message(chat_id=chat_id, sender_id=sender_id, content=data.content)
        created_message = self.repository.add_message(message)
        self.repository.touch(chat)

        refreshed = self.repository.get_by_id(chat_id)

        recipient_id = chat.user_two_id if chat.user_one_id == sender_id else chat.user_one_id
        await self._push_message_to_user(recipient_id, chat_id, created_message)

        return self._to_chat_response(refreshed, sender_id)

    async def _push_message_to_user(self, user_id: int, chat_id: int, message: Message) -> None:
        payload = WebSocketOutgoingMessage(
            chat_id=chat_id,
            message=MessageResponse.model_validate(message),
        )
        await connection_manager.send_to_user(user_id, payload.model_dump(mode="json"))

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_or_404(self, chat_id: int) -> Chat:
        chat = self.repository.get_by_id(chat_id)
        if chat is None:
            raise ResourceNotFoundException("Conversación no encontrada")
        return chat

    def _ensure_participant(self, user_id: int, chat: Chat) -> None:
        if user_id not in (chat.user_one_id, chat.user_two_id):
            raise ForbiddenException("No tienes acceso a esta conversación")

    def _validate_chat_roles(self, current_role: str, other_role: str) -> None:
        """
        Valida combinaciones de roles permitidas para iniciar un chat:
          - Cliente <-> Admin de Tienda
          - Admin de Tienda <-> Super Admin
          - Cualquiera <-> Super Admin (soporte)
        """
        roles = {current_role, other_role}

        valid_combinations = [
            {RoleName.CLIENT.value, RoleName.STORE_ADMIN.value},
            {RoleName.STORE_ADMIN.value, RoleName.SUPER_ADMIN.value},
            {RoleName.CLIENT.value, RoleName.SUPER_ADMIN.value},
        ]

        if roles not in valid_combinations and len(roles) == 2:
            raise BadRequestException("No es posible iniciar una conversación entre estos roles")

        if len(roles) == 1:
            raise BadRequestException("No es posible iniciar una conversación entre usuarios del mismo rol")

    def _to_chat_response(self, chat: Chat, current_user_id: int) -> ChatResponse:
        other_user = chat.user_two if chat.user_one_id == current_user_id else chat.user_one
        return ChatResponse.model_validate(
            {
                "id": chat.id,
                "other_user": other_user,
                "store": chat.store,
                "messages": chat.messages,
                "created_at": chat.created_at,
                "updated_at": chat.updated_at,
            }
        )
