"""
=====================================================================
ARIX BACKEND - Módulo Products: Service
=====================================================================
"""

from app.common.enums.statuses import ProductStatus
from app.common.exceptions.custom_exceptions import (
    ConflictException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.categories.repository import CategoryRepository
from app.modules.inventory.models import Inventory
from app.modules.inventory.repository import InventoryRepository
from app.modules.products.models import Product, ProductImage
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import (
    AddProductImageRequest,
    CreateProductRequest,
    ProductFilterParams,
    ProductImageResponse,
    ProductResponse,
    ProductSummaryResponse,
    UpdateProductRequest,
    UpdateProductStatusRequest,
)
from app.modules.stores.repository import StoreRepository


class ProductService:
    """Casos de uso relacionados a productos del catálogo."""

    def __init__(
        self,
        repository: ProductRepository,
        category_repository: CategoryRepository,
        store_repository: StoreRepository,
        inventory_repository: InventoryRepository,
    ):
        self.repository = repository
        self.category_repository = category_repository
        self.store_repository = store_repository
        self.inventory_repository = inventory_repository

    # -----------------------------------------------------------------
    # Catálogo público (Cliente)
    # -----------------------------------------------------------------

    def search_catalog(self, filters: ProductFilterParams, page: int, size: int) -> PageResponse[ProductSummaryResponse]:
        offset = max(page - 1, 0) * size
        items, total = self.repository.search_catalog(filters, offset=offset, limit=size, only_active=True)
        summaries = [self._to_summary(p) for p in items]
        return PageResponse.create(summaries, total, PageParams(page=page, size=size))

    def get_product_detail(self, product_id: int) -> ProductResponse:
        product = self.repository.get_by_id(product_id)
        if product is None or product.status != ProductStatus.ACTIVE.value:
            raise ResourceNotFoundException("Producto no encontrado")
        return ProductResponse.model_validate(product)

    def list_top_selling(self, limit: int = 10) -> list[ProductSummaryResponse]:
        items = self.repository.list_top_selling(limit)
        return [self._to_summary(p) for p in items]

    # -----------------------------------------------------------------
    # Gestión por Admin de Tienda
    # -----------------------------------------------------------------

    def create_product(self, admin_user_id: int, data: CreateProductRequest) -> ProductResponse:
        store = self._get_store_or_404(admin_user_id)

        category = self.category_repository.get_by_id(data.category_id)
        if category is None:
            raise ResourceNotFoundException("La categoría especificada no existe")

        if self.repository.exists_slug_in_store(store.id, data.slug):
            raise ConflictException("Ya tienes un producto con ese slug en tu tienda")

        product = Product(
            store_id=store.id,
            category_id=data.category_id,
            name=data.name,
            slug=data.slug,
            description=data.description,
            price=data.price,
            sku=data.sku,
            status=ProductStatus.ACTIVE.value,
            is_moderated=True,
        )
        created = self.repository.create(product)

        inventory = Inventory(
            product_id=created.id,
            stock_quantity=data.initial_stock,
            min_stock=data.min_stock,
        )
        self.inventory_repository.create(inventory)

        refreshed = self.repository.get_by_id(created.id)
        return ProductResponse.model_validate(refreshed)

    def update_product(self, admin_user_id: int, product_id: int, data: UpdateProductRequest) -> ProductResponse:
        product = self._get_owned_product_or_404(admin_user_id, product_id)

        if data.category_id is not None:
            category = self.category_repository.get_by_id(data.category_id)
            if category is None:
                raise ResourceNotFoundException("La categoría especificada no existe")
            product.category_id = data.category_id

        if data.name is not None:
            product.name = data.name
        if data.description is not None:
            product.description = data.description
        if data.price is not None:
            product.price = data.price
        if data.sku is not None:
            product.sku = data.sku

        updated = self.repository.update(product)
        return ProductResponse.model_validate(updated)

    def update_product_status(self, admin_user_id: int, product_id: int, data: UpdateProductStatusRequest) -> ProductResponse:
        product = self._get_owned_product_or_404(admin_user_id, product_id)
        product.status = data.status.value
        updated = self.repository.update(product)
        return ProductResponse.model_validate(updated)

    def delete_product(self, admin_user_id: int, product_id: int) -> None:
        product = self._get_owned_product_or_404(admin_user_id, product_id)

        if self.repository.has_order_items(product.id):
            raise ConflictException(
                "No se puede eliminar un producto que ya tiene pedidos registrados. "
                "Puedes desactivarlo desde el estado del producto para ocultarlo del catálogo."
            )

        self.repository.delete(product)

    def list_my_products(self, admin_user_id: int, page: int, size: int) -> PageResponse[ProductResponse]:
        store = self._get_store_or_404(admin_user_id)
        offset = max(page - 1, 0) * size
        items, total = self.repository.list_by_store(store.id, offset=offset, limit=size)
        responses = [ProductResponse.model_validate(p) for p in items]
        return PageResponse.create(responses, total, PageParams(page=page, size=size))

    # -----------------------------------------------------------------
    # Imágenes de producto
    # -----------------------------------------------------------------

    def add_product_image(self, admin_user_id: int, product_id: int, data: AddProductImageRequest) -> ProductResponse:
        product = self._get_owned_product_or_404(admin_user_id, product_id)

        if data.is_primary:
            self.repository.unset_primary_images(product.id)

        image = ProductImage(
            product_id=product.id,
            image_url=data.image_url,
            is_primary=data.is_primary,
            display_order=data.display_order,
        )
        self.repository.add_image(image)

        refreshed = self.repository.get_by_id(product.id)
        return ProductResponse.model_validate(refreshed)

    def delete_product_image(self, admin_user_id: int, product_id: int, image_id: int) -> ProductResponse:
        product = self._get_owned_product_or_404(admin_user_id, product_id)

        image = self.repository.get_image_by_id(image_id)
        if image is None or image.product_id != product.id:
            raise ResourceNotFoundException("Imagen no encontrada para este producto")

        self.repository.delete_image(image)

        refreshed = self.repository.get_by_id(product.id)
        return ProductResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_store_or_404(self, admin_user_id: int):
        store = self.store_repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")
        return store

    def _get_owned_product_or_404(self, admin_user_id: int, product_id: int) -> Product:
        store = self._get_store_or_404(admin_user_id)

        product = self.repository.get_by_id(product_id)
        if product is None:
            raise ResourceNotFoundException("Producto no encontrado")

        if product.store_id != store.id:
            raise ForbiddenException("Este producto no pertenece a tu tienda")

        return product

    @staticmethod
    def _to_summary(product: Product) -> ProductSummaryResponse:
        return ProductSummaryResponse.model_validate(
            {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "price": product.price,
                "status": product.status,
                "primary_image_url": product.primary_image_url,
                "rating_avg": product.rating_avg,
                "rating_count": product.rating_count,
                "sales_count": product.sales_count,
                "store": product.store,
                "category": product.category,
            }
        )
