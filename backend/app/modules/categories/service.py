"""
=====================================================================
ARIX BACKEND - Módulo Categories: Service
=====================================================================
"""

from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ConflictException,
    ResourceNotFoundException,
)
from app.modules.categories.models import Category
from app.modules.categories.repository import CategoryRepository
from app.modules.categories.schemas import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)


class CategoryService:
    """Casos de uso relacionados a categorías del catálogo."""

    def __init__(self, repository: CategoryRepository):
        self.repository = repository

    def create_category(self, data: CreateCategoryRequest) -> CategoryResponse:
        if self.repository.exists_by_name(data.name):
            raise ConflictException("Ya existe una categoría con ese nombre")
        if self.repository.exists_by_slug(data.slug):
            raise ConflictException("Ya existe una categoría con ese slug")

        if data.parent_id is not None:
            parent = self.repository.get_by_id(data.parent_id)
            if parent is None:
                raise ResourceNotFoundException("La categoría padre especificada no existe")

        category = Category(
            name=data.name,
            slug=data.slug,
            description=data.description,
            parent_id=data.parent_id,
        )
        created = self.repository.create(category)
        return CategoryResponse.model_validate(created)

    def update_category(self, category_id: int, data: UpdateCategoryRequest) -> CategoryResponse:
        category = self._get_or_404(category_id)

        if data.name is not None and data.name != category.name:
            if self.repository.exists_by_name(data.name):
                raise ConflictException("Ya existe una categoría con ese nombre")
            category.name = data.name

        if data.description is not None:
            category.description = data.description

        if data.parent_id is not None:
            if data.parent_id == category_id:
                raise BadRequestException("Una categoría no puede ser su propia categoría padre")
            parent = self.repository.get_by_id(data.parent_id)
            if parent is None:
                raise ResourceNotFoundException("La categoría padre especificada no existe")
            category.parent_id = data.parent_id

        updated = self.repository.update(category)
        return CategoryResponse.model_validate(updated)

    def delete_category(self, category_id: int) -> None:
        category = self._get_or_404(category_id)

        if category.children:
            raise ConflictException("No se puede eliminar una categoría que tiene subcategorías")

        if self.repository.has_products(category_id):
            raise ConflictException("No se puede eliminar una categoría que tiene productos asociados")

        self.repository.delete(category)

    def get_category(self, category_id: int) -> CategoryResponse:
        category = self._get_or_404(category_id)
        return CategoryResponse.model_validate(category)

    def list_categories_tree(self) -> list[CategoryResponse]:
        """Retorna las categorías raíz con sus subcategorías anidadas."""
        roots = self.repository.list_root_categories()
        return [CategoryResponse.model_validate(c) for c in roots]

    def list_categories_flat(self) -> list[CategoryResponse]:
        """Retorna todas las categorías en una lista plana (sin anidar)."""
        categories = self.repository.list_all()
        return [
            CategoryResponse(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                parent_id=c.parent_id,
                children=[],
            )
            for c in categories
        ]

    def _get_or_404(self, category_id: int) -> Category:
        category = self.repository.get_by_id(category_id)
        if category is None:
            raise ResourceNotFoundException("Categoría no encontrada")
        return category
