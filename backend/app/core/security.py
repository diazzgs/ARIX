"""
=====================================================================
ARIX BACKEND - Seguridad: hashing de contraseñas y JWT
=====================================================================
Funciones utilitarias para:
  - Hashear y verificar contraseñas (bcrypt vía passlib).
  - Crear y decodificar tokens JWT (access y refresh).
=====================================================================
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


# =====================================================================
# CONTRASEÑAS
# =====================================================================

def hash_password(password: str) -> str:
    """Genera el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña en texto plano coincida con su hash."""
    return pwd_context.verify(plain_password, hashed_password)


# =====================================================================
# JWT
# =====================================================================

def _create_token(subject: str, token_type: str, expires_delta: timedelta, extra_claims: dict[str, Any] | None = None) -> str:
    """Crea un token JWT firmado con los claims indicados."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int, role: str) -> str:
    """Crea un access token JWT para un usuario autenticado."""
    return _create_token(
        subject=str(user_id),
        token_type=ACCESS_TOKEN_TYPE,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims={"role": role},
    )


def create_refresh_token(user_id: int) -> str:
    """Crea un refresh token JWT para un usuario autenticado."""
    return _create_token(
        subject=str(user_id),
        token_type=REFRESH_TOKEN_TYPE,
        expires_delta=timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES),
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida un token JWT.

    Lanza jose.JWTError si el token es inválido o expiró.
    """
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "JWTError",
    "ACCESS_TOKEN_TYPE",
    "REFRESH_TOKEN_TYPE",
]
