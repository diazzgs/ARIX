"""
=====================================================================
ARIX BACKEND - Módulo Categories: Repository
=====================================================================
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.modules.categories.models import Category


class CategoryRepository:
    """Operaciones de acceso a datos para categorías."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, category_id: int) -> Category | None:
        stmt = (
            select(Category)
            .options(joinedload(Category.children))
            .where(Category.id == category_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def exists_by_name(self, name: str) -> bool:
        stmt = select(Category.id).where(Category.name == name)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def exists_by_slug(self, slug: str) -> bool:
        stmt = select(Category.id).where(Category.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def list_root_categories(self) -> list[Category]:
        """Lista las categorías raíz (sin padre) con sus subcategorías cargadas."""
        stmt = (
            select(Category)
            .options(joinedload(Category.children))
            .where(Category.parent_id.is_(None))
            .order_by(Category.name.asc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def list_all(self) -> list[Category]:
        stmt = select(Category).order_by(Category.name.asc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.commit()

    def has_products(self, category_id: int) -> bool:
        """Verifica si la categoría tiene productos asociados (para evitar borrado)."""
        from app.modules.products.models import Product  # import local para evitar ciclo

        stmt = select(Product.id).where(Product.category_id == category_id)
        return self.db.execute(stmt).scalar_one_or_none() is not None
