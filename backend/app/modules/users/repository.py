"""
=====================================================================
ARIX BACKEND - Módulo Users: Repository
=====================================================================
Capa de acceso a datos. No contiene lógica de negocio, solo
operaciones CRUD sobre los modelos User, Role y PasswordResetToken.
=====================================================================
"""

from datetime import datetime

from sqlalchemy import asc, desc, or_, select
from sqlalchemy.orm import Session, joinedload

from app.common.enums.roles import RoleName
from app.common.enums.statuses import UserStatus
from app.modules.users.models import PasswordResetToken, Role, User


class UserRepository:
    """Operaciones de acceso a datos para usuarios y roles."""

    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------
    # Roles
    # -----------------------------------------------------------------

    def get_role_by_name(self, name: RoleName) -> Role | None:
        stmt = select(Role).where(Role.name == name.value)
        return self.db.execute(stmt).scalar_one_or_none()

    # -----------------------------------------------------------------
    # Usuarios
    # -----------------------------------------------------------------

    def get_by_id(self, user_id: int) -> User | None:
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(User.id == user_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where(User.email == email)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def exists_by_email(self, email: str) -> bool:
        stmt = select(User.id).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def list_all(
        self,
        role_name: RoleName | None = None,
        status: UserStatus | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        offset: int = 0,
        limit: int = 10,
    ) -> tuple[list[User], int]:
        stmt = select(User).options(joinedload(User.role))
        count_stmt = select(User.id)

        if role_name is not None:
            stmt = stmt.join(Role).where(Role.name == role_name.value)
            count_stmt = count_stmt.join(Role).where(Role.name == role_name.value)

        if status is not None:
            stmt = stmt.where(User.status == status.value)
            count_stmt = count_stmt.where(User.status == status.value)

        if search:
            term = f"%{search.strip()}%"
            search_filter = or_(User.full_name.ilike(term), User.email.ilike(term))
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total = len(self.db.execute(count_stmt).all())

        sort_column = {
            "full_name": User.full_name,
            "email": User.email,
            "created_at": User.created_at,
        }.get(sort_by, User.created_at)
        order_fn = asc if sort_dir == "asc" else desc

        stmt = stmt.order_by(order_fn(sort_column)).offset(offset).limit(limit)
        items = list(self.db.execute(stmt).scalars().all())

        return items, total

    def list_active_by_role(self, role_name: RoleName) -> list[User]:
        """Lista usuarios activos de un rol dado, sin paginar (ej. para listar
        contactos disponibles al iniciar un chat)."""
        stmt = (
            select(User)
            .join(Role)
            .options(joinedload(User.role))
            .where(Role.name == role_name.value, User.status == UserStatus.ACTIVE.value)
            .order_by(User.full_name.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    # -----------------------------------------------------------------
    # Tokens de recuperación de contraseña
    # -----------------------------------------------------------------

    def create_password_reset_token(self, token: PasswordResetToken) -> PasswordResetToken:
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token

    def get_valid_reset_token(self, token: str) -> PasswordResetToken | None:
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def mark_reset_token_used(self, reset_token: PasswordResetToken) -> None:
        reset_token.used = True
        self.db.commit()