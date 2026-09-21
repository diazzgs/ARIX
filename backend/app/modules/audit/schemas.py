"""
=====================================================================
ARIX BACKEND - Módulo Audit: Schemas Pydantic
=====================================================================
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditUserSummary(BaseModel):
    """Resumen del usuario que ejecutó la acción."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str


class AuditLogResponse(BaseModel):
    """Representación de un registro de auditoría."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user: AuditUserSummary | None
    action: str
    entity_type: str
    entity_id: int | None
    details: dict[str, Any] | None
    ip_address: str | None
    created_at: datetime
