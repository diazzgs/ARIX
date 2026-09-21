"""
=====================================================================
ARIX BACKEND - Enums de estados
=====================================================================
Enums compartidos entre módulos, correspondientes a las columnas
ENUM definidas en el esquema SQL de ARIX.
=====================================================================
"""

import enum


class UserStatus(str, enum.Enum):
    """Estado de una cuenta de usuario (tabla users.status)."""
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"
    SUSPENDED = "SUSPENDED"


class StoreStatus(str, enum.Enum):
    """Estado de una tienda (tabla stores.status)."""
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class ProductStatus(str, enum.Enum):
    """Estado de publicación de un producto (tabla products.status)."""
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    DRAFT = "DRAFT"


class OrderStatus(str, enum.Enum):
    """Estados del ciclo de vida de una orden/suborden."""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    """Métodos de pago simulados (sin pasarela real)."""
    CREDIT_CARD = "CREDIT_CARD"
    DEBIT_CARD = "DEBIT_CARD"


class PaymentStatus(str, enum.Enum):
    """Estado de un pago simulado (tabla payments.status)."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class InvoiceType(str, enum.Enum):
    """Tipo de factura generada (tabla invoices.type)."""
    STORE = "STORE"
    CONSOLIDATED = "CONSOLIDATED"


class ReviewStatus(str, enum.Enum):
    """Estado de moderación de una reseña (tabla reviews.status)."""
    VISIBLE = "VISIBLE"
    HIDDEN = "HIDDEN"
    REPORTED = "REPORTED"


class TicketStatus(str, enum.Enum):
    """Estado de un ticket de soporte (tabla tickets.status)."""
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(str, enum.Enum):
    """Prioridad de un ticket de soporte (tabla tickets.priority)."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class NotificationType(str, enum.Enum):
    """Tipo de notificación enviada a un usuario (tabla notifications.type)."""
    ORDER = "ORDER"
    TICKET = "TICKET"
    CHAT = "CHAT"
    SYSTEM = "SYSTEM"
    STORE = "STORE"
