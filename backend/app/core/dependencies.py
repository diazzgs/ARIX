"""
=====================================================================
ARIX BACKEND - Dependencias de autenticación y autorización
=====================================================================
Provee dependencias reutilizables para:
  - Extraer y validar el usuario autenticado a partir del JWT.
  - Restringir endpoints según el rol del usuario (RBAC).
=====================================================================
"""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.common.enums.roles import RoleName
from app.common.enums.statuses import UserStatus
from app.common.exceptions.custom_exceptions import ForbiddenException, UnauthorizedException
from app.core.security import ACCESS_TOKEN_TYPE, JWTError, decode_token
from app.db.session import get_db
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

# HTTPBearer muestra en Swagger un simple campo "Value" para pegar el token,
# en lugar del formulario OAuth2 de usuario/contraseña.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Extrae y valida el usuario autenticado a partir del header
    "Authorization: Bearer <token>".

    Lanza UnauthorizedException si el token falta, es inválido,
    expiró, o el usuario no existe / está bloqueado.
    """
    if credentials is None:
        raise UnauthorizedException("No se proporcionó un token de autenticación")

    token = credentials.credentials

    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedException("Token inválido o expirado")

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise UnauthorizedException("El token proporcionado no es un access token")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Token inválido")

    repository = UserRepository(db)
    user = repository.get_by_id(int(user_id))
    if user is None:
        raise UnauthorizedException("Usuario no encontrado")

    if user.status != UserStatus.ACTIVE.value:
        raise ForbiddenException("Tu cuenta está bloqueada o suspendida")

    return user


class RequireRole:
    """
    Dependencia parametrizable para restringir un endpoint a uno o
    varios roles específicos.

    Uso:
        @router.get("/admin-only")
        def endpoint(user: User = Depends(RequireRole(RoleName.SUPER_ADMIN))):
            ...
    """

    def __init__(self, *allowed_roles: RoleName):
        self.allowed_roles = {role.value for role in allowed_roles}

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in self.allowed_roles:
            raise ForbiddenException("No tienes permisos para realizar esta acción")
        return current_user
