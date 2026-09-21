"""
=====================================================================
ARIX BACKEND - Módulo Stores: Schemas Pydantic
=====================================================================
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.common.enums.statuses import StoreStatus


# =====================================================================
# PERFIL DE TIENDA
# =====================================================================

class StoreProfileResponse(BaseModel):
    """Información extendida de la tienda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    tagline: str | None
    about: str | None
    social_facebook: str | None
    social_instagram: str | None
    social_website: str | None
    tax_id: str | None


class StoreProfileUpsertRequest(BaseModel):
    """Crear/actualizar el perfil extendido de la tienda."""

    tagline: str | None = Field(default=None, max_length=255)
    about: str | None = None
    social_facebook: str | None = Field(default=None, max_length=255)
    social_instagram: str | None = Field(default=None, max_length=255)
    social_website: str | None = Field(default=None, max_length=255)
    tax_id: str | None = Field(default=None, max_length=50)


# =====================================================================
# TIENDA
# =====================================================================

class StoreAdminSummary(BaseModel):
    """Resumen del administrador asignado a una tienda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr


class StoreResponse(BaseModel):
    """Representación completa de una tienda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str
    description: str | None
    logo_url: str | None
    banner_url: str | None
    contact_email: str | None
    contact_phone: str | None
    contact_address: str | None
    status: StoreStatus
    admin: StoreAdminSummary | None
    profile: StoreProfileResponse | None
    created_at: datetime


class StoreSummaryResponse(BaseModel):
    """Versión resumida de una tienda, para catálogos/listados públicos."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str
    logo_url: str | None
    banner_url: str | None
    status: StoreStatus


class CreateStoreRequest(BaseModel):
    """Creación de una tienda (Super Admin)."""

    business_name: str = Field(min_length=2, max_length=150)
    slug: str = Field(min_length=2, max_length=180, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_address: str | None = Field(default=None, max_length=255)
    admin_user_id: int | None = Field(
        default=None,
        description="ID del usuario (rol ADMIN_TIENDA) que administrará la tienda",
    )


class UpdateStoreRequest(BaseModel):
    """Actualización de datos de una tienda (Super Admin)."""

    business_name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_address: str | None = Field(default=None, max_length=255)
    admin_user_id: int | None = None


class UpdateStoreStatusRequest(BaseModel):
    """Suspender/reactivar una tienda (Super Admin)."""

    status: StoreStatus


class UpdateStoreBrandingRequest(BaseModel):
    """Actualización del nombre comercial, descripción y datos de contacto por el Admin de Tienda."""

    business_name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_address: str | None = Field(default=None, max_length=255)
