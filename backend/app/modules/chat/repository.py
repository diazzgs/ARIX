"""
=====================================================================
ARIX BACKEND - Módulo Chat: Repository
=====================================================================
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.modules.chat.models import Chat, Message


class ChatRepository:
    """Operaciones de acceso a datos para chats y mensajes."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, chat_id: int) -> Chat | None:
        stmt = (
            select(Chat)
            .options(
                joinedload(Chat.user_one),
                joinedload(Chat.user_two),
                joinedload(Chat.store),
                joinedload(Chat.messages).joinedload(Message.sender),
            )
            .where(Chat.id == chat_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_between_users(self, user_one_id: int, user_two_id: int, store_id: int | None) -> Chat | None:
        """Busca un chat existente entre dos usuarios (en cualquier orden), con el mismo store_id."""
        stmt = (
            select(Chat)
            .options(
                joinedload(Chat.user_one),
                joinedload(Chat.user_two),
                joinedload(Chat.store),
                joinedload(Chat.messages).joinedload(Message.sender),
            )
            .where(
                or_(
                    and_(Chat.user_one_id == user_one_id, Chat.user_two_id == user_two_id),
                    and_(Chat.user_one_id == user_two_id, Chat.user_two_id == user_one_id),
                ),
                Chat.store_id == store_id if store_id is not None else Chat.store_id.is_(None),
            )
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_for_user(self, user_id: int) -> list[Chat]:
        """Lista todos los chats donde el usuario es uno de los dos participantes."""
        stmt = (
            select(Chat)
            .options(
                joinedload(Chat.user_one),
                joinedload(Chat.user_two),
                joinedload(Chat.store),
                joinedload(Chat.messages).joinedload(Message.sender),
            )
            .where(or_(Chat.user_one_id == user_id, Chat.user_two_id == user_id))
            .order_by(Chat.updated_at.desc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def create(self, chat: Chat) -> Chat:
        self.db.add(chat)
        self.db.commit()
        self.db.refresh(chat)
        return chat

    def touch(self, chat: Chat) -> None:
        """Actualiza updated_at del chat (al recibir un nuevo mensaje)."""
        self.db.commit()
        self.db.refresh(chat)

    # -----------------------------------------------------------------
    # Mensajes
    # -----------------------------------------------------------------

    def add_message(self, message: Message) -> Message:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def mark_messages_as_read(self, chat_id: int, reader_user_id: int) -> None:
        """Marca como leídos todos los mensajes de un chat que no fueron enviados por reader_user_id."""
        stmt = select(Message).where(
            Message.chat_id == chat_id,
            Message.sender_id != reader_user_id,
            Message.is_read.is_(False),
        )
        for message in self.db.execute(stmt).scalars().all():
            message.is_read = True
        self.db.commit()

    def count_unread(self, chat_id: int, reader_user_id: int) -> int:
        stmt = select(func.count(Message.id)).where(
            Message.chat_id == chat_id,
            Message.sender_id != reader_user_id,
            Message.is_read.is_(False),
        )
        return self.db.execute(stmt).scalar_one()
