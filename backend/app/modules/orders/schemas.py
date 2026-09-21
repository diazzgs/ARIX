"""
=====================================================================
ARIX BACKEND - Módulo Orders: Schemas Pydantic
=====================================================================
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.common.enums.statuses import OrderStatus, PaymentMethod, PaymentStatus


# =====================================================================
# CHECKOUT (Cliente)
# =====================================================================

class CheckoutItem(BaseModel):
    """Un producto y cantidad dentro del carrito enviado al checkout."""

    product_id: int
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    """Solicitud de checkout: carrito + dirección + método de pago simulado."""

    items: list[CheckoutItem] = Field(min_length=1)
    shipping_address: str = Field(min_length=5, max_length=255)
    payment_method: PaymentMethod
    card_last_digits: str | None = Field(default=None, min_length=4, max_length=4)

    @field_validator("items")
    @classmethod
    def validate_unique_products(cls, items: list[CheckoutItem]) -> list[CheckoutItem]:
        product_ids = [item.product_id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("No se puede incluir el mismo producto más de una vez en el carrito")
        return items


# =====================================================================
# RESPUESTAS — ITEMS, SUBÓRDENES, PAGO
# =====================================================================

class OrderItemResponse(BaseModel):
    """Detalle de un producto dentro de una suborden."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class StoreOrderStoreSummary(BaseModel):
    """Resumen de la tienda dentro de una suborden."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    slug: str
    logo_url: str | None


class StoreOrderResponse(BaseModel):
    """Suborden: parte de una orden principal correspondiente a una tienda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sub_order_number: str
    store: StoreOrderStoreSummary
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    status: OrderStatus
    items: list[OrderItemResponse]
    created_at: datetime


class PaymentResponse(BaseModel):
    """Pago simulado asociado a una orden."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_method: PaymentMethod
    card_last_digits: str | None
    amount: Decimal
    status: PaymentStatus
    paid_at: datetime | None


class OrderResponse(BaseModel):
    """Orden principal completa, con sus subórdenes por tienda."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    total_amount: Decimal
    status: OrderStatus
    shipping_address: str
    payment_method: PaymentMethod
    store_orders: list[StoreOrderResponse]
    payment: PaymentResponse | None
    created_at: datetime


class OrderSummaryResponse(BaseModel):
    """Versión resumida de una orden para listados de historial."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    total_amount: Decimal
    status: OrderStatus
    created_at: datetime


# =====================================================================
# GESTIÓN POR ADMIN DE TIENDA
# =====================================================================

class UpdateStoreOrderStatusRequest(BaseModel):
    """Cambio de estado de una suborden por el Admin de Tienda."""

    status: OrderStatus

    @field_validator("status")
    @classmethod
    def validate_allowed_status(cls, value: OrderStatus) -> OrderStatus:
        allowed = {
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
        }
        if value not in allowed:
            raise ValueError("Estado no permitido para una suborden")
        return value


class StoreOrderListItemResponse(BaseModel):
    """Suborden dentro de un listado para el Admin de Tienda (incluye datos del cliente y orden)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sub_order_number: str
    order_number: str
    customer_name: str
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    status: OrderStatus
    items: list[OrderItemResponse]
    created_at: datetime
