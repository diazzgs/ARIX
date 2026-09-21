"""
=====================================================================
ARIX BACKEND - Módulo Products: Router
=====================================================================
Expone los endpoints de:
  - Catálogo público (Cliente): búsqueda, filtros, detalle
  - Gestión de productos por el Admin de Tienda
=====================================================================
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.schemas.response import ApiResponse
from app.common.schemas.pagination import PageResponse
from app.core.dependencies import RequireRole
from app.db.session import get_db
from app.modules.categories.repository import CategoryRepository
from app.modules.inventory.repository import InventoryRepository
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import (
    AddProductImageRequest,
    CreateProductRequest,
    ProductFilterParams,
    ProductResponse,
    ProductSummaryResponse,
    UpdateProductRequest,
    UpdateProductStatusRequest,
)
from app.modules.products.service import ProductService
from app.modules.stores.repository import StoreRepository
from app.modules.users.models import User
from app.utils.file_storage import SUBFOLDER_PRODUCTS, save_image

router = APIRouter(tags=["Productos"])


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(
        ProductRepository(db),
        CategoryRepository(db),
        StoreRepository(db),
        InventoryRepository(db),
    )


# =====================================================================
# CATÁLOGO PÚBLICO — /api/products
# =====================================================================

@router.get(
    "/products",
    response_model=ApiResponse[PageResponse[ProductSummaryResponse]],
    summary="Buscar productos en el catálogo (público)",
)
def search_products(
    search: str | None = Query(default=None, description="Texto de búsqueda en nombre/descripción"),
    category_id: int | None = Query(default=None),
    store_id: int | None = Query(default=None),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort_by: str = Query(default="created_at", pattern="^(price|popularity|created_at)$"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=12, ge=1, le=100),
    service: ProductService = Depends(get_product_service),
):
    """
    Búsqueda de productos en el catálogo global con filtros por categoría,
    tienda, rango de precio y ordenamiento por precio, popularidad o fecha.
    """
    filters = ProductFilterParams(
        search=search,
        category_id=category_id,
        store_id=store_id,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    result = service.search_catalog(filters, page, size)
    return ApiResponse.ok(result)


@router.get(
    "/products/top-selling",
    response_model=ApiResponse[list[ProductSummaryResponse]],
    summary="Productos más vendidos (público)",
)
def top_selling_products(
    limit: int = Query(default=10, ge=1, le=50),
    service: ProductService = Depends(get_product_service),
):
    """Retorna los productos con mayor número de ventas."""
    result = service.list_top_selling(limit)
    return ApiResponse.ok(result)


@router.get(
    "/products/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Detalle de producto (público)",
)
def get_product_detail(product_id: int, service: ProductService = Depends(get_product_service)):
    """Obtiene el detalle completo de un producto activo, incluyendo imágenes e inventario."""
    result = service.get_product_detail(product_id)
    return ApiResponse.ok(result)


# =====================================================================
# ADMIN DE TIENDA — /api/store/products
# =====================================================================

@router.get(
    "/store/products",
    response_model=ApiResponse[PageResponse[ProductResponse]],
    summary="Listar mis productos (Admin de Tienda)",
)
def list_my_products(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Lista todos los productos (cualquier estado) de la tienda del admin autenticado."""
    result = service.list_my_products(current_user.id, page, size)
    return ApiResponse.ok(result)


@router.post(
    "/store/products",
    response_model=ApiResponse[ProductResponse],
    summary="Crear producto (Admin de Tienda)",
)
def create_product(
    data: CreateProductRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Crea un nuevo producto en la tienda del admin autenticado, con inventario inicial."""
    result = service.create_product(current_user.id, data)
    return ApiResponse.ok(result, message="Producto creado exitosamente")


@router.put(
    "/store/products/{product_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Editar producto (Admin de Tienda)",
)
def update_product(
    product_id: int,
    data: UpdateProductRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Actualiza nombre, descripción, precio, SKU o categoría de un producto propio."""
    result = service.update_product(current_user.id, product_id, data)
    return ApiResponse.ok(result, message="Producto actualizado correctamente")


@router.put(
    "/store/products/{product_id}/status",
    response_model=ApiResponse[ProductResponse],
    summary="Habilitar/deshabilitar producto (Admin de Tienda)",
)
def update_product_status(
    product_id: int,
    data: UpdateProductStatusRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Cambia el estado de un producto (ACTIVE, DISABLED, DRAFT)."""
    result = service.update_product_status(current_user.id, product_id, data)
    return ApiResponse.ok(result, message="Estado del producto actualizado correctamente")


@router.delete(
    "/store/products/{product_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar producto (Admin de Tienda)",
)
def delete_product(
    product_id: int,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Elimina permanentemente un producto propio (y su inventario/imágenes asociadas)."""
    service.delete_product(current_user.id, product_id)
    return ApiResponse.ok({}, message="Producto eliminado correctamente")


# =====================================================================
# IMÁGENES DE PRODUCTO — /api/store/products/{product_id}/images
# =====================================================================

@router.post(
    "/store/products/{product_id}/images",
    response_model=ApiResponse[ProductResponse],
    summary="Agregar imagen a producto (Admin de Tienda)",
)
def add_product_image(
    product_id: int,
    data: AddProductImageRequest,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Agrega una imagen a un producto propio a partir de una URL. Si is_primary=true, reemplaza la imagen principal."""
    result = service.add_product_image(current_user.id, product_id, data)
    return ApiResponse.ok(result, message="Imagen agregada correctamente")


@router.post(
    "/store/products/{product_id}/images/upload",
    response_model=ApiResponse[ProductResponse],
    summary="Subir archivo de imagen para un producto (Admin de Tienda)",
)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(..., description="Imagen JPG, PNG, WEBP o GIF (máx. 10MB)"),
    is_primary: bool = Query(default=False, description="Si es true, esta imagen se marca como principal"),
    display_order: int = Query(default=0),
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Sube un archivo de imagen y lo agrega como imagen de un producto propio."""
    image_url = save_image(file, SUBFOLDER_PRODUCTS)
    data = AddProductImageRequest(image_url=image_url, is_primary=is_primary, display_order=display_order)
    result = service.add_product_image(current_user.id, product_id, data)
    return ApiResponse.ok(result, message="Imagen subida y agregada correctamente")


@router.delete(
    "/store/products/{product_id}/images/{image_id}",
    response_model=ApiResponse[ProductResponse],
    summary="Eliminar imagen de producto (Admin de Tienda)",
)
def delete_product_image(
    product_id: int,
    image_id: int,
    current_user: User = Depends(RequireRole(RoleName.STORE_ADMIN)),
    service: ProductService = Depends(get_product_service),
):
    """Elimina una imagen de un producto propio."""
    result = service.delete_product_image(current_user.id, product_id, image_id)
    return ApiResponse.ok(result, message="Imagen eliminada correctamente")
