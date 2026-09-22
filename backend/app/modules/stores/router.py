"""
=====================================================================
ARIX BACKEND - Módulo Stores: Router
=====================================================================
Expone los endpoints de:
  - Gestión de tiendas por el Super Administrador
  - Perfil de tienda gestionado por el Administrador de Tienda
  - Listado público de tiendas activas (marketplace)
=====================================================================
"""

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.enums.statuses import NotificationType, StoreStatus
from app.common.schemas.pagination import PageParams, PageResponse
from app.common.schemas.response import ApiResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
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
from app.modules.stores.service import StoreService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.utils.events import notify_user, record_audit_log
from app.utils.file_storage import SUBFOLDER_STORES, save_image

router = APIRouter(tags=["Tiendas"])


def get_store_service(db: Session = Depends(get_db)) -> StoreService:
    return StoreService(StoreRepository(db), UserRepository(db))


# =====================================================================
# PÚBLICO — /api/stores (marketplace)
# =====================================================================

@router.get(
    "/stores",
    response_model=ApiResponse[PageResponse[StoreSummaryResponse]],
    summary="Listar tiendas activas (público)",
)
def list_active_stores(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    service: StoreService = Depends(get_store_service),
):
    """Lista las tiendas activas visibles en el marketplace."""
    items, total = service.list_active_stores(page, size)
    return ApiResponse.ok(PageResponse.create(items, total, PageParams(page=page, size=size)))


@router.get(
    "/stores/{slug}",
    response_model=ApiResponse[StoreResponse],
    summary="Obtener tienda por slug (público)",
)
def get_store_by_slug(slug: str, service: StoreService = Depends(get_store_service)):
    """Obtiene el detalle público de una tienda por su slug."""
    result = service.get_store_by_slug(slug)
    return ApiResponse.ok(result)


# =====================================================================
# ADMIN DE TIENDA — /api/store/me
# =====================================================================

@router.get(
    "/store/me",
    response_model=ApiResponse[StoreResponse],
    summary="Obtener mi tienda (Admin de Tienda)",
)
def get_my_store(
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Retorna la tienda asignada al administrador autenticado."""
    result = service.get_my_store(current_user.id)
    return ApiResponse.ok(result)


@router.put(
    "/store/me",
    response_model=ApiResponse[StoreResponse],
    summary="Actualizar datos de mi tienda (Admin de Tienda)",
)
def update_my_store(
    data: UpdateStoreBrandingRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Actualiza nombre comercial, descripción y datos de contacto de la tienda."""
    result = service.update_my_store_branding(current_user.id, data)
    return ApiResponse.ok(result, message="Tienda actualizada correctamente")


@router.put(
    "/store/me/profile",
    response_model=ApiResponse[StoreResponse],
    summary="Actualizar perfil extendido de mi tienda (Admin de Tienda)",
)
def update_my_store_profile(
    data: StoreProfileUpsertRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Actualiza la información extendida (tagline, redes sociales, RTN, etc.) de la tienda."""
    result = service.update_my_store_profile(current_user.id, data)
    return ApiResponse.ok(result, message="Perfil de tienda actualizado correctamente")


@router.post(
    "/store/me/logo",
    response_model=ApiResponse[StoreResponse],
    summary="Subir logo de mi tienda (Admin de Tienda)",
)
def upload_my_store_logo(
    file: UploadFile = File(..., description="Imagen JPG, PNG, WEBP o GIF (máx. 10MB)"),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Sube el logo de la tienda del admin autenticado."""
    image_url = save_image(file, SUBFOLDER_STORES)
    result = service.update_my_store_logo(current_user.id, image_url)
    return ApiResponse.ok(result, message="Logo actualizado correctamente")


@router.post(
    "/store/me/banner",
    response_model=ApiResponse[StoreResponse],
    summary="Subir banner de mi tienda (Admin de Tienda)",
)
def upload_my_store_banner(
    file: UploadFile = File(..., description="Imagen JPG, PNG, WEBP o GIF (máx. 10MB)"),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Sube el banner principal de la tienda del admin autenticado."""
    image_url = save_image(file, SUBFOLDER_STORES)
    result = service.update_my_store_banner(current_user.id, image_url)
    return ApiResponse.ok(result, message="Banner actualizado correctamente")


# =====================================================================
# SUPER ADMIN — /api/admin/stores
# =====================================================================

@router.post(
    "/admin/stores",
    response_model=ApiResponse[StoreResponse],
    summary="Crear tienda (Super Admin)",
)
def create_store(
    data: CreateStoreRequest,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
    db: Session = Depends(get_db),
):
    """Crea una nueva tienda en la plataforma. Solo el Super Admin puede hacerlo."""
    result = service.create_store(data)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="STORE_CREATED",
        entity_type="STORE",
        entity_id=result.id,
        details={"business_name": result.business_name, "slug": result.slug},
    )
    if result.admin is not None:
        notify_user(
            db,
            user_id=result.admin.id,
            title="Se te ha asignado una tienda",
            message=f"Ahora administras la tienda '{result.business_name}' en ARIX.",
            type_=NotificationType.STORE,
            reference_id=result.id,
        )

    return ApiResponse.ok(result, message="Tienda creada exitosamente")


@router.get(
    "/admin/stores",
    response_model=ApiResponse[PageResponse[StoreResponse]],
    summary="Listar todas las tiendas (Super Admin)",
)
def list_stores(
    status_filter: StoreStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Lista todas las tiendas, opcionalmente filtradas por estado."""
    items, total = service.list_stores(status_filter, page, size)
    return ApiResponse.ok(PageResponse.create(items, total, PageParams(page=page, size=size)))


@router.post(
    "/admin/stores/{store_id}/logo",
    response_model=ApiResponse[StoreResponse],
    summary="Subir logo de una tienda (Super Admin)",
)
def upload_store_logo_by_admin(
    store_id: int,
    file: UploadFile = File(..., description="Imagen JPG, PNG, WEBP o GIF (máx. 10MB)"),
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
    db: Session = Depends(get_db),
):
    """Sube o reemplaza el logo de cualquier tienda de la plataforma."""
    image_url = save_image(file, SUBFOLDER_STORES)
    result = service.update_store_logo_by_admin(store_id, image_url)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="STORE_LOGO_CHANGED",
        entity_type="STORE",
        entity_id=store_id,
    )

    return ApiResponse.ok(result, message="Logo actualizado correctamente")


@router.get(
    "/admin/stores/{store_id}",
    response_model=ApiResponse[StoreResponse],
    summary="Obtener tienda por ID (Super Admin)",
)
def get_store(
    store_id: int,
    _: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
):
    """Obtiene el detalle completo de una tienda."""
    result = service.get_store(store_id)
    return ApiResponse.ok(result)


@router.put(
    "/admin/stores/{store_id}",
    response_model=ApiResponse[StoreResponse],
    summary="Editar tienda (Super Admin)",
)
def update_store(
    store_id: int,
    data: UpdateStoreRequest,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
    db: Session = Depends(get_db),
):
    """Actualiza los datos de una tienda, incluyendo su administrador asignado."""
    result = service.update_store(store_id, data)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="STORE_UPDATED",
        entity_type="STORE",
        entity_id=store_id,
        details=data.model_dump(exclude_none=True),
    )

    return ApiResponse.ok(result, message="Tienda actualizada correctamente")


@router.put(
    "/admin/stores/{store_id}/status",
    response_model=ApiResponse[StoreResponse],
    summary="Suspender/reactivar tienda (Super Admin)",
)
def update_store_status(
    store_id: int,
    data: UpdateStoreStatusRequest,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
    db: Session = Depends(get_db),
):
    """Cambia el estado de una tienda (ACTIVE, SUSPENDED, DELETED)."""
    result = service.update_store_status(store_id, data)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="STORE_STATUS_CHANGED",
        entity_type="STORE",
        entity_id=store_id,
        details={"new_status": data.status.value},
    )
    if result.admin is not None:
        notify_user(
            db,
            user_id=result.admin.id,
            title="Estado de tu tienda actualizado",
            message=f"Tu tienda '{result.business_name}' ahora está en estado {data.status.value}.",
            type_=NotificationType.STORE,
            reference_id=store_id,
        )

    return ApiResponse.ok(result, message="Estado de la tienda actualizado correctamente")


@router.delete(
    "/admin/stores/{store_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar tienda (Super Admin)",
)
def delete_store(
    store_id: int,
    current_user: User = Depends(RequireRole(RoleName.SUPER_ADMIN)),
    service: StoreService = Depends(get_store_service),
    db: Session = Depends(get_db),
):
    """Elimina (borrado lógico) una tienda de la plataforma."""
    service.delete_store(store_id)

    record_audit_log(
        db,
        user_id=current_user.id,
        action="STORE_DELETED",
        entity_type="STORE",
        entity_id=store_id,
    )

    return ApiResponse.ok({}, message="Tienda eliminada correctamente")