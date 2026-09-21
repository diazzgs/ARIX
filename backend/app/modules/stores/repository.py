"""
=====================================================================
ARIX BACKEND - Módulo Stores: Repository
=====================================================================
Capa de acceso a datos para tiendas y perfiles de tienda.
=====================================================================
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.modules.stores.models import Store, StoreProfile


class StoreRepository:
    """Operaciones de acceso a datos para tiendas."""

    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------
    # Tiendas
    # -----------------------------------------------------------------

    def get_by_id(self, store_id: int) -> Store | None:
        stmt = (
            select(Store)
            .options(joinedload(Store.admin), joinedload(Store.profile))
            .where(Store.id == store_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Store | None:
        stmt = (
            select(Store)
            .options(joinedload(Store.admin), joinedload(Store.profile))
            .where(Store.slug == slug)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_admin_user_id(self, admin_user_id: int) -> Store | None:
        stmt = (
            select(Store)
            .options(joinedload(Store.admin), joinedload(Store.profile))
            .where(Store.admin_user_id == admin_user_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def exists_by_slug(self, slug: str) -> bool:
        stmt = select(Store.id).where(Store.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def list_all(
        self,
        status: str | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> tuple[list[Store], int]:
        stmt = select(Store).options(joinedload(Store.admin), joinedload(Store.profile))
        count_stmt = select(Store.id)

        if status is not None:
            stmt = stmt.where(Store.status == status)
            count_stmt = count_stmt.where(Store.status == status)

        total = len(self.db.execute(count_stmt).all())

        stmt = stmt.order_by(Store.id.asc()).offset(offset).limit(limit)
        items = list(self.db.execute(stmt).unique().scalars().all())

        return items, total

    def list_active(self, offset: int = 0, limit: int = 10) -> tuple[list[Store], int]:
        return self.list_all(status="ACTIVE", offset=offset, limit=limit)

    def create(self, store: Store) -> Store:
        self.db.add(store)
        self.db.commit()
        self.db.refresh(store)
        return store

    def update(self, store: Store) -> Store:
        self.db.commit()
        self.db.refresh(store)
        return store

    def delete(self, store: Store) -> None:
        self.db.delete(store)
        self.db.commit()

    # -----------------------------------------------------------------
    # Perfiles de tienda
    # -----------------------------------------------------------------

    def get_profile_by_store_id(self, store_id: int) -> StoreProfile | None:
        stmt = select(StoreProfile).where(StoreProfile.store_id == store_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def upsert_profile(self, profile: StoreProfile) -> StoreProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
