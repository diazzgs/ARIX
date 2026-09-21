"""
=====================================================================
ARIX BACKEND - Sesión de base de datos
=====================================================================
Configura el engine de SQLAlchemy y provee la dependencia "get_db"
para inyectar sesiones de base de datos en los endpoints de FastAPI.
=====================================================================
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Engine de conexión a MySQL.
# pool_pre_ping evita errores por conexiones "muertas" tras inactividad.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI que provee una sesión de base de datos
    por request y se asegura de cerrarla al finalizar.

    Uso:
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
