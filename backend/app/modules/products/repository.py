"""
=====================================================================
ARIX BACKEND - Módulo Products: Repository
=====================================================================
"""

from decimal import Decimal

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.modules.orders.models import OrderItem
from app.modules.products.models import Product, ProductImage
from app.modules.products.schemas import ProductFilterParams


class ProductRepository:
    """Operaciones de acceso a datos para productos e imágenes."""

    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------
    # Lectura
    # -----------------------------------------------------------------

    def get_by_id(self, product_id: int) -> Product | None:
        stmt = (
            select(Product)
            .options(
                joinedload(Product.store),
                joinedload(Product.category),
                joinedload(Product.images),
                joinedload(Product.inventory),
            )
            .where(Product.id == product_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_store_and_slug(self, store_id: int, slug: str) -> Product | None:
        stmt = (
            select(Product)
            .options(
                joinedload(Product.store),
                joinedload(Product.category),
                joinedload(Product.images),
                joinedload(Product.inventory),
            )
            .where(Product.store_id == store_id, Product.slug == slug)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def exists_slug_in_store(self, store_id: int, slug: str) -> bool:
        stmt = select(Product.id).where(Product.store_id == store_id, Product.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    # -----------------------------------------------------------------
    # Catálogo público (filtros, búsqueda, orden, paginación)
    # -----------------------------------------------------------------

    def search_catalog(
        self,
        filters: ProductFilterParams,
        offset: int = 0,
        limit: int = 10,
        only_active: bool = True,
    ) -> tuple[list[Product], int]:
        stmt = select(Product).options(
            joinedload(Product.store),
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.inventory),
        )
        count_stmt = select(func.count(Product.id))

        conditions = []

        if only_active:
            conditions.append(Product.status == "ACTIVE")

        if filters.search:
            term = f"%{filters.search}%"
            conditions.append(
                or_(Product.name.ilike(term), Product.description.ilike(term))
            )

        if filters.category_id is not None:
            conditions.append(Product.category_id == filters.category_id)

        if filters.store_id is not None:
            conditions.append(Product.store_id == filters.store_id)

        if filters.min_price is not None:
            conditions.append(Product.price >= filters.min_price)

        if filters.max_price is not None:
            conditions.append(Product.price <= filters.max_price)

        for cond in conditions:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        # Ordenamiento
        sort_column = {
            "price": Product.price,
            "popularity": Product.sales_count,
            "created_at": Product.created_at,
        }[filters.sort_by]

        order_func = asc if filters.sort_dir == "asc" else desc
        stmt = stmt.order_by(order_func(sort_column))

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_by_store(self, store_id: int, offset: int = 0, limit: int = 10) -> tuple[list[Product], int]:
        stmt = (
            select(Product)
            .options(
                joinedload(Product.store),
                joinedload(Product.category),
                joinedload(Product.images),
                joinedload(Product.inventory),
            )
            .where(Product.store_id == store_id)
            .order_by(Product.created_at.desc())
        )
        count_stmt = select(func.count(Product.id)).where(Product.store_id == store_id)

        total = self.db.execute(count_stmt).scalar_one()

        stmt = stmt.offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_top_selling(self, limit: int = 10) -> list[Product]:
        stmt = (
            select(Product)
            .options(joinedload(Product.store), joinedload(Product.category), joinedload(Product.images))
            .where(Product.status == "ACTIVE")
            .order_by(Product.sales_count.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    # -----------------------------------------------------------------
    # Escritura
    # -----------------------------------------------------------------

    def create(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product) -> Product:
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

    def has_order_items(self, product_id: int) -> bool:
        """True si el producto aparece en al menos un pedido ya realizado."""
        stmt = select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    # -----------------------------------------------------------------
    # Imágenes
    # -----------------------------------------------------------------

    def add_image(self, image: ProductImage) -> ProductImage:
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def get_image_by_id(self, image_id: int) -> ProductImage | None:
        stmt = select(ProductImage).where(ProductImage.id == image_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def delete_image(self, image: ProductImage) -> None:
        self.db.delete(image)
        self.db.commit()

    def unset_primary_images(self, product_id: int) -> None:
        stmt = select(ProductImage).where(
            ProductImage.product_id == product_id, ProductImage.is_primary.is_(True)
        )
        for image in self.db.execute(stmt).scalars().all():
            image.is_primary = False
        self.db.commit()