"""
=====================================================================
ARIX BACKEND - Módulo Stores: Service
=====================================================================
Lógica de negocio para gestión de tiendas (Super Admin) y perfil
de tienda (Admin de Tienda).
=====================================================================
"""

from app.common.enums.roles import RoleName
from app.common.enums.statuses import StoreStatus
from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.modules.stores.models import Store, StoreProfile
from app.modules.stores.repository import StoreRepository
from app.modules.stores.schemas import (
    CreateStoreRequest,
    StoreProfileUpsertRequest,
    StoreResponse,
    StoreSummaryResponse,
    UpdateStoreBrandingRequest,
    UpdateStoreRequest,
    UpdateStoreStatusRequest,
)
from app.modules.users.repository import UserRepository

DEFAULT_LOGO_URL = "/images/stores/default-logo.png"
DEFAULT_BANNER_URL = "/images/stores/default-banner.png"


class StoreService:
    """Casos de uso relacionados a tiendas."""

    def __init__(self, repository: StoreRepository, user_repository: UserRepository):
        self.repository = repository
        self.user_repository = user_repository

    # -----------------------------------------------------------------
    # Creación y gestión (Super Admin)
    # -----------------------------------------------------------------

    def create_store(self, data: CreateStoreRequest) -> StoreResponse:
        if self.repository.exists_by_slug(data.slug):
            raise ConflictException("Ya existe una tienda con ese slug")

        if data.admin_user_id is not None:
            self._validate_admin_assignment(data.admin_user_id)

        store = Store(
            business_name=data.business_name,
            slug=data.slug,
            description=data.description,
            logo_url=DEFAULT_LOGO_URL,
            banner_url=DEFAULT_BANNER_URL,
            contact_email=data.contact_email,
            contact_phone=data.contact_phone,
            contact_address=data.contact_address,
            status=StoreStatus.ACTIVE.value,
            admin_user_id=data.admin_user_id,
        )
        created = self.repository.create(store)

        # Crear perfil extendido vacío por defecto
        profile = StoreProfile(store_id=created.id)
        self.repository.upsert_profile(profile)

        refreshed = self.repository.get_by_id(created.id)
        return StoreResponse.model_validate(refreshed)

    def update_store(self, store_id: int, data: UpdateStoreRequest) -> StoreResponse:
        store = self._get_store_or_404(store_id)

        if data.business_name is not None:
            store.business_name = data.business_name
        if data.description is not None:
            store.description = data.description
        if data.contact_email is not None:
            store.contact_email = data.contact_email
        if data.contact_phone is not None:
            store.contact_phone = data.contact_phone
        if data.contact_address is not None:
            store.contact_address = data.contact_address

        if data.admin_user_id is not None:
            self._validate_admin_assignment(data.admin_user_id, current_store_id=store.id)
            store.admin_user_id = data.admin_user_id

        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    def update_store_logo_by_admin(self, store_id: int, logo_url: str) -> StoreResponse:
        """Sube/reemplaza el logo de cualquier tienda. Solo para el Super Admin."""
        store = self._get_store_or_404(store_id)
        store.logo_url = logo_url
        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    def update_store_status(self, store_id: int, data: UpdateStoreStatusRequest) -> StoreResponse:
        store = self._get_store_or_404(store_id)
        store.status = data.status.value
        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    def delete_store(self, store_id: int) -> None:
        store = self._get_store_or_404(store_id)
        # Borrado lógico: se marca como DELETED en lugar de eliminar físicamente
        # para preservar integridad referencial con productos/órdenes históricas.
        store.status = StoreStatus.DELETED.value
        self.repository.update(store)

    # -----------------------------------------------------------------
    # Listados
    # -----------------------------------------------------------------

    def list_stores(self, status: StoreStatus | None, page: int, size: int) -> tuple[list[StoreResponse], int]:
        offset = max(page - 1, 0) * size
        status_value = status.value if status else None
        stores, total = self.repository.list_all(status=status_value, offset=offset, limit=size)
        return [StoreResponse.model_validate(s) for s in stores], total

    def list_active_stores(self, page: int, size: int) -> tuple[list[StoreSummaryResponse], int]:
        """Listado público de tiendas activas (para el marketplace)."""
        offset = max(page - 1, 0) * size
        stores, total = self.repository.list_active(offset=offset, limit=size)
        return [StoreSummaryResponse.model_validate(s) for s in stores], total

    def get_store(self, store_id: int) -> StoreResponse:
        store = self._get_store_or_404(store_id)
        return StoreResponse.model_validate(store)

    def get_store_by_slug(self, slug: str) -> StoreResponse:
        store = self.repository.get_by_slug(slug)
        if store is None:
            raise ResourceNotFoundException("Tienda no encontrada")
        return StoreResponse.model_validate(store)

    # -----------------------------------------------------------------
    # Perfil de tienda (Admin de Tienda)
    # -----------------------------------------------------------------

    def get_my_store(self, admin_user_id: int) -> StoreResponse:
        store = self.repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")
        return StoreResponse.model_validate(store)

    def update_my_store_branding(self, admin_user_id: int, data: UpdateStoreBrandingRequest) -> StoreResponse:
        store = self.repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")

        if data.business_name is not None:
            store.business_name = data.business_name
        if data.description is not None:
            store.description = data.description
        if data.contact_email is not None:
            store.contact_email = data.contact_email
        if data.contact_phone is not None:
            store.contact_phone = data.contact_phone
        if data.contact_address is not None:
            store.contact_address = data.contact_address

        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    def update_my_store_profile(self, admin_user_id: int, data: StoreProfileUpsertRequest) -> StoreResponse:
        store = self.repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")

        profile = self.repository.get_profile_by_store_id(store.id)
        if profile is None:
            profile = StoreProfile(store_id=store.id)

        for field in (
            "tagline",
            "about",
            "social_facebook",
            "social_instagram",
            "social_website",
            "tax_id",
        ):
            value = getattr(data, field)
            if value is not None:
                setattr(profile, field, value)

        self.repository.upsert_profile(profile)

        refreshed = self.repository.get_by_id(store.id)
        return StoreResponse.model_validate(refreshed)

    def update_my_store_logo(self, admin_user_id: int, logo_url: str) -> StoreResponse:
        store = self.repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")

        store.logo_url = logo_url
        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    def update_my_store_banner(self, admin_user_id: int, banner_url: str) -> StoreResponse:
        store = self.repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")

        store.banner_url = banner_url
        updated = self.repository.update(store)
        return StoreResponse.model_validate(updated)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_store_or_404(self, store_id: int) -> Store:
        store = self.repository.get_by_id(store_id)
        if store is None:
            raise ResourceNotFoundException("Tienda no encontrada")
        return store

    def _validate_admin_assignment(self, admin_user_id: int, current_store_id: int | None = None) -> None:
        """Valida que el usuario exista, tenga rol ADMIN_TIENDA y no administre ya otra tienda."""
        admin_user = self.user_repository.get_by_id(admin_user_id)
        if admin_user is None:
            raise ResourceNotFoundException("El usuario administrador especificado no existe")

        if admin_user.role.name != RoleName.STORE_ADMIN.value:
            raise BadRequestException("El usuario asignado debe tener el rol de Administrador de Tienda")

        existing_store = self.repository.get_by_admin_user_id(admin_user_id)
        if existing_store is not None and existing_store.id != current_store_id:
            raise ConflictException("Este administrador ya tiene una tienda asignada")