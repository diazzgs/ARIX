"""
=====================================================================
ARIX BACKEND - Módulo Users: Router
=====================================================================
Expone los endpoints de:
  - Autenticación (registro, login, refresh, recuperación de contraseña)
  - Perfil del usuario autenticado
  - Gestión de usuarios por el Super Administrador
=====================================================================
"""

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.enums.statuses import NotificationType
from app.common.schemas.response import ApiResponse
from app.common.schemas.pagination import PageResponse, PageParams
from app.core.dependencies import RequireRole, get_current_user
from app.db.session import get_db
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    ChangePasswordRequest,
    CreateStoreAdminRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UpdateUserStatusRequest,
    UserResponse,
)
from app.modules.users.service import UserService
from app.utils.events import notify_user, record_audit_log
from app.utils.file_storage import SUBFOLDER_AVATARS, save_image

router = APIRouter(tags=["Usuarios"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


# =====================================================================
# AUTENTICACIÓN — /api/auth
# =====================================================================

@router.post("/auth/register", response_model=ApiResponse[TokenResponse], summary="Registro de cliente")
def register(data: RegisterRequest, service: UserService = Depends(get_user_service)):
    """Registra una nueva cuenta de cliente. Único rol que puede autorregistrarse."""
    result = service.register_client(data)
    return ApiResponse.ok(result, message="Cuenta creada exitosamente")


@router.post("/auth/login", response_model=ApiResponse[TokenResponse], summary="Iniciar sesión")
def login(data: LoginRequest, service: UserService = Depends(get_user_service)):
    """Autentica a un usuario (cliente, admin de tienda o super admin)."""
    result = service.login(data)
    return ApiResponse.ok(result, message="Sesión iniciada correctamente")


@router.post("/auth/refresh", response_model=ApiResponse[TokenResponse], summary="Renovar access token")
def refresh_token(data: RefreshTokenRequest, service: UserService = Depends(get_user_service)):
    """Genera un nuevo access token a partir de un refresh token válido."""
    result = service.refresh_access_token(data.refresh_token)
    return ApiResponse.ok(result, message="Token renovado correctamente")


@router.post("/auth/forgot-password", response_model=ApiResponse[dict], summary="Solicitar recuperación de contraseña")
def forgot_password(data: ForgotPasswordRequest, service: UserService = Depends(get_user_service)):
    """
    Genera un token de recuperación de contraseña.

    NOTA: en este entorno de desarrollo el token se retorna directamente
    en la respuesta para facilitar las pruebas. En producción se enviaría
    únicamente por correo electrónico.
    """
    token = service.request_password_reset(data)
    return ApiResponse.ok(
        {"reset_token": token},
        message="Si el correo existe, se ha generado un token de recuperación",
    )


@router.post("/auth/reset-password", response_model=ApiResponse[dict], summary="Restablecer contraseña con token")
def reset_password(data: ResetPasswordRequest, service: UserService = Depends(get_user_service)):
    """Restablece la contraseña usando el token de recuperación."""
    service.reset_password(data)
    return ApiResponse.ok({}, message="Contraseña restablecida correctamente")


@router.post("/auth/logout", response_model=ApiResponse[dict], summary="Cerrar sesión")
def logout(current_user: User = Depends(get_current_user)):
    """
    Cierra la sesión del usuario.

    Como la autenticación es stateless (JWT), el cierre de sesión se
    gestiona eliminando el token en el cliente (frontend). Este endpoint
    existe para mantener un flujo de logout explícito y poder
    extenderlo en el futuro (ej. listas de tokens revocados).
    """
    return ApiResponse.ok({}, message="Sesión cerrada correctamente")


# =====================================================================
# PERFIL — /api/users/me
# =====================================================================

@router.get("/users/me", response_model=ApiResponse[UserResponse], summary="Obtener mi perfil")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Retorna los datos del usuario autenticado."""
    result = service.get_profile(current_user.id)
    return ApiResponse.ok(result)


@router.put("/users/me", response_model=ApiResponse[UserResponse], summary="Actualizar mi perfil")
def update_my_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Actualiza nombre, teléfono y/o dirección del usuario autenticado."""
    result = service.update_profile(current_user.id, data)
    return ApiResponse.ok(result, message="Perfil actualizado correctamente")


@router.put("/users/me/password", response_model=ApiResponse[dict], summary="Cambiar mi contraseña")
def change_my_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Cambia la contraseña del usuario autenticado, validando la actual."""
    service.change_password(current_user.id, data)
    return ApiResponse.ok({}, message="Contraseña actualizada correctamente")


@router.post(
    "/users/me/avatar",
    response_model=ApiResponse[UserResponse],
    summary="Subir foto de perfil",
)
def upload_my_avatar(
    file: UploadFile = File(..., description="Imagen JPG, PNG, WEBP o GIF (máx. 10MB)"),
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Sube una nueva foto de perfil y la asigna al usuario autenticado."""
    image_url = save_image(file, SUBFOLDER_AVATARS)
    result = service.update_profile_image(current_user.id, image_url)
    return ApiResponse.ok(result, message="Foto de perfil actualizada correctamente")


# =====================================================================
# GESTIÓN DE USUARIOS — /api/admin/users (Super Admin)
# =====================================================================

@router.post(
    "/admin/users/store-admins",
    response_model=ApiResponse[UserResponse],
    summary="Crear administrador de tienda (Super Admin)",
)
def create_store_admin(
    data: CreateStoreAdminRequest,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
):
    """Crea una cuenta de administrador de tienda. Solo el Super Admin puede hacerlo."""
    result = service.create_store_admin(data)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="ADMIN_CREATED",
        entity_type="USER",
        entity_id=result.id,
        details={"email": result.email, "role": "ROLE_STORE_ADMIN"},
    )

    return ApiResponse.ok(result, message="Administrador de tienda creado exitosamente")


@router.get(
    "/admin/users",
    response_model=ApiResponse[PageResponse[UserResponse]],
    summary="Listar usuarios (Super Admin)",
)
def list_users(
    role: RoleName | None = Query(default=None, description="Filtrar por rol"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: UserService = Depends(get_user_service),
):
    """Lista todos los usuarios de la plataforma, opcionalmente filtrados por rol."""
    items, total = service.list_users(role, page, size)
    page_response = PageResponse.create(items, total, PageParams(page=page, size=size))
    return ApiResponse.ok(page_response)


@router.put(
    "/admin/users/{user_id}/status",
    response_model=ApiResponse[UserResponse],
    summary="Bloquear/reactivar usuario (Super Admin)",
)
def update_user_status(
    user_id: int,
    data: UpdateUserStatusRequest,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
):
    """Cambia el estado de un usuario (ACTIVE, BLOCKED, SUSPENDED)."""
    result = service.update_user_status(user_id, data)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="USER_STATUS_CHANGED",
        entity_type="USER",
        entity_id=user_id,
        details={"new_status": data.status.value},
    )
    notify_user(
        db,
        user_id=user_id,
        title="Tu cuenta ha sido actualizada",
        message=f"Tu cuenta en ARIX ahora está en estado {data.status.value}.",
        type_=NotificationType.SYSTEM,
        reference_id=user_id,
    )

    return ApiResponse.ok(result, message="Estado del usuario actualizado correctamente")
