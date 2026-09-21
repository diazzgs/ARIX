"""
=====================================================================
ARIX BACKEND - Base declarativa de SQLAlchemy
=====================================================================
Todos los modelos (User, Store, Product, etc.) heredarán de "Base".
Se centraliza aquí para evitar importaciones circulares entre módulos.
=====================================================================
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base declarativa para todos los modelos ORM de ARIX."""
    pass
