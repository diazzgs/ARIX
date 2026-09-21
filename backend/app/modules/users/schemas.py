"""
=====================================================================
ARIX BACKEND - Módulo Users: Schemas Pydantic
=====================================================================
Define los esquemas de entrada (requests) y salida (responses)
para autenticación, perfil de usuario y administración de usuarios.
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.common.enums.roles import RoleName
from app.common.enums.statuses import UserStatus


# =====================================================================
# AUTENTICACIÓN
# =====================================================================

class RegisterRequest(BaseModel):
    """Registro de un nuevo cliente (único rol que puede autorregistrarse)."""

    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    """Inicio de sesión."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Respuesta tras login/registro exitoso."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    """Solicitud de renovación de access token."""

    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Cambio de contraseña estando autenticado."""

    current_password: str
    new_password: str = Field(min_length=8, max_length=100)


class ForgotPasswordRequest(BaseModel):
    """Solicitud de recuperación de contraseña."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Restablecimiento de contraseña con token recibido por correo."""

    token: str
    new_password: str = Field(min_length=8, max_length=100)


# =====================================================================
# PERFIL DE USUARIO
# =====================================================================

class RoleResponse(BaseModel):
    """Representación de un rol."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: RoleName


class UserResponse(BaseModel):
    """Representación pública de un usuario."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    address: str | None
    profile_image_url: str
    status: UserStatus
    email_verified: bool
    role: RoleResponse
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    """Actualización de datos personales del usuario autenticado."""

    full_name: str | None = Field(default=None, min_length=3, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)


# =====================================================================
# GESTIÓN DE USUARIOS (SUPER ADMIN)
# =====================================================================

class CreateStoreAdminRequest(BaseModel):
    """Creación de un administrador de tienda (solo Super Admin)."""

    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)


class UpdateUserStatusRequest(BaseModel):
    """Bloquear/reactivar un usuario (Super Admin)."""

    status: UserStatus


# Resolución de referencias adelantadas (TokenResponse -> UserResponse)
TokenResponse.model_rebuild()
