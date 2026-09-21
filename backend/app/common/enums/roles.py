"""
=====================================================================
ARIX BACKEND - Roles del sistema
=====================================================================
"""

import enum


class RoleName(str, enum.Enum):
    """Roles disponibles en la plataforma ARIX."""
    CLIENT = "ROLE_CLIENT"
    STORE_ADMIN = "ROLE_STORE_ADMIN"
    SUPER_ADMIN = "ROLE_SUPER_ADMIN"
