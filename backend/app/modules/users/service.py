"""
=====================================================================
ARIX BACKEND - Módulo Users: Service
=====================================================================
Lógica de negocio para autenticación, gestión de perfil y
administración de usuarios (creación de admins por Super Admin).
=====================================================================
"""

import secrets
from datetime import datetime, timedelta

from app.common.enums.roles import RoleName
from app.common.enums.statuses import UserStatus
from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    ResourceNotFoundException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    JWTError,
    REFRESH_TOKEN_TYPE,
)
from app.modules.users.models import PasswordResetToken, User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    ChangePasswordRequest,
    CreateStoreAdminRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UpdateUserStatusRequest,
    UserResponse,
)

RESET_TOKEN_EXPIRATION_MINUTES = 30
DEFAULT_AVATAR_URL = "/images/default-avatar.png"


class UserService:
    """Casos de uso relacionados a usuarios y autenticación."""

    def __init__(self, repository: UserRepository):
        self.repository = repository

    # -----------------------------------------------------------------
    # Registro y login
    # -----------------------------------------------------------------

    def register_client(self, data: RegisterRequest) -> TokenResponse:
        """Registra un nuevo cliente. Solo clientes pueden autorregistrarse."""
        if self.repository.exists_by_email(data.email):
            raise ConflictException("Ya existe una cuenta registrada con ese correo electrónico")

        client_role = self.repository.get_role_by_name(RoleName.CLIENT)
        if client_role is None:
            raise ResourceNotFoundException("El rol de cliente no está configurado en el sistema")

        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            phone=data.phone,
            address=data.address,
            profile_image_url=DEFAULT_AVATAR_URL,
            role_id=client_role.id,
            status=UserStatus.ACTIVE.value,
            email_verified=False,
        )
        created_user = self.repository.create(user)

        return self._build_token_response(created_user)

    def login(self, data: LoginRequest) -> TokenResponse:
        """Autentica a un usuario y emite tokens JWT."""
        user = self.repository.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Correo electrónico o contraseña incorrectos")

        if user.status != UserStatus.ACTIVE.value:
            raise ForbiddenException("Tu cuenta está bloqueada o suspendida. Contacta a soporte.")

        return self._build_token_response(user)

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Genera un nuevo access token a partir de un refresh token válido."""
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedException("Refresh token inválido o expirado")

        if payload.get("type") != REFRESH_TOKEN_TYPE:
            raise UnauthorizedException("El token proporcionado no es un refresh token")

        user_id = int(payload.get("sub"))
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        if user.status != UserStatus.ACTIVE.value:
            raise ForbiddenException("Tu cuenta está bloqueada o suspendida. Contacta a soporte.")

        return self._build_token_response(user)

    # -----------------------------------------------------------------
    # Perfil del usuario autenticado
    # -----------------------------------------------------------------

    def get_profile(self, user_id: int) -> UserResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")
        return UserResponse.model_validate(user)

    def update_profile(self, user_id: int, data: UpdateProfileRequest) -> UserResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.phone is not None:
            user.phone = data.phone
        if data.address is not None:
            user.address = data.address

        updated = self.repository.update(user)
        return UserResponse.model_validate(updated)

    def update_profile_image(self, user_id: int, image_url: str) -> UserResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        user.profile_image_url = image_url
        updated = self.repository.update(user)
        return UserResponse.model_validate(updated)

    # -----------------------------------------------------------------
    # Contraseñas
    # -----------------------------------------------------------------

    def change_password(self, user_id: int, data: ChangePasswordRequest) -> None:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        if not verify_password(data.current_password, user.password_hash):
            raise BadRequestException("La contraseña actual no es correcta")

        user.password_hash = hash_password(data.new_password)
        self.repository.update(user)

    def request_password_reset(self, data: ForgotPasswordRequest) -> str:
        """
        Genera un token de recuperación de contraseña.

        Retorna el token generado. En producción este token se enviaría
        por correo electrónico; no se revela si el correo existe o no
        para evitar enumeración de usuarios.
        """
        user = self.repository.get_by_email(data.email)
        if user is None:
            # No revelar si el correo existe; retornar token vacío.
            return ""

        token_value = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token_value,
            expires_at=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRATION_MINUTES),
            used=False,
        )
        self.repository.create_password_reset_token(reset_token)
        return token_value

    def reset_password(self, data: ResetPasswordRequest) -> None:
        reset_token = self.repository.get_valid_reset_token(data.token)
        if reset_token is None:
            raise BadRequestException("El token de recuperación es inválido o ha expirado")

        user = self.repository.get_by_id(reset_token.user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        user.password_hash = hash_password(data.new_password)
        self.repository.update(user)
        self.repository.mark_reset_token_used(reset_token)

    # -----------------------------------------------------------------
    # Gestión de usuarios (Super Admin)
    # -----------------------------------------------------------------

    def create_store_admin(self, data: CreateStoreAdminRequest) -> UserResponse:
        """Crea un administrador de tienda. Solo puede ser ejecutado por el Super Admin."""
        if self.repository.exists_by_email(data.email):
            raise ConflictException("Ya existe una cuenta registrada con ese correo electrónico")

        store_admin_role = self.repository.get_role_by_name(RoleName.STORE_ADMIN)
        if store_admin_role is None:
            raise ResourceNotFoundException("El rol de administrador de tienda no está configurado")

        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            phone=data.phone,
            address=data.address,
            profile_image_url=DEFAULT_AVATAR_URL,
            role_id=store_admin_role.id,
            status=UserStatus.ACTIVE.value,
            email_verified=True,
        )
        created = self.repository.create(user)
        return UserResponse.model_validate(created)

    def list_users(self, role_name: RoleName | None, page: int, size: int) -> tuple[list[UserResponse], int]:
        offset = max(page - 1, 0) * size
        users, total = self.repository.list_all(role_name=role_name, offset=offset, limit=size)
        return [UserResponse.model_validate(u) for u in users], total

    def update_user_status(self, user_id: int, data: UpdateUserStatusRequest) -> UserResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise ResourceNotFoundException("Usuario no encontrado")

        if user.role.name == RoleName.SUPER_ADMIN.value:
            raise ForbiddenException("No se puede modificar el estado del Super Administrador")

        user.status = data.status.value
        updated = self.repository.update(user)
        return UserResponse.model_validate(updated)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _build_token_response(self, user: User) -> TokenResponse:
        access_token = create_access_token(user_id=user.id, role=user.role.name)
        refresh_token = create_refresh_token(user_id=user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )
