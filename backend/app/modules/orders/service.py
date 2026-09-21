"""
=====================================================================
ARIX BACKEND - Módulo Orders: Service
=====================================================================
Contiene la lógica del checkout multi-tienda:
  1. Valida que todos los productos existan, estén activos y tengan stock.
  2. Agrupa los items del carrito por tienda.
  3. Crea la orden principal, una suborden por tienda y los order_items.
  4. Calcula subtotales, impuestos simulados y totales.
  5. Registra el pago simulado y descuenta el inventario.
  6. Incrementa el contador de ventas de cada producto.
=====================================================================
"""

from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from app.common.enums.statuses import NotificationType, OrderStatus, PaymentStatus
from app.common.exceptions.custom_exceptions import (
    BadRequestException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.common.schemas.pagination import PageParams, PageResponse
from app.modules.inventory.repository import InventoryRepository
from app.modules.orders.models import Order, OrderItem, Payment, StoreOrder
from app.modules.orders.repository import OrderRepository
from app.modules.orders.schemas import (
    CheckoutRequest,
    OrderItemResponse,
    OrderResponse,
    OrderSummaryResponse,
    StoreOrderListItemResponse,
    StoreOrderResponse,
    UpdateStoreOrderStatusRequest,
)
from app.modules.products.repository import ProductRepository
from app.modules.stores.repository import StoreRepository
from app.utils.events import notify_user, record_audit_log
from app.utils.order_numbers import build_order_number, build_sub_order_number

# Tasa de impuesto simulada (15%)
TAX_RATE = Decimal("0.15")


class OrderService:
    """Casos de uso relacionados a órdenes, checkout y gestión de pedidos."""

    def __init__(
        self,
        repository: OrderRepository,
        product_repository: ProductRepository,
        inventory_repository: InventoryRepository,
        store_repository: StoreRepository,
    ):
        self.repository = repository
        self.product_repository = product_repository
        self.inventory_repository = inventory_repository
        self.store_repository = store_repository

    # -----------------------------------------------------------------
    # Checkout (Cliente)
    # -----------------------------------------------------------------

    def checkout(self, customer_id: int, data: CheckoutRequest) -> OrderResponse:
        """
        Procesa el checkout de un carrito multi-tienda.

        Lanza BadRequestException si algún producto no existe, está
        inactivo, o no tiene stock suficiente.
        """
        # 1. Validar productos y agrupar por tienda
        items_by_store: dict[int, list[dict]] = {}
        product_cache: dict[int, object] = {}

        for cart_item in data.items:
            product = self.product_repository.get_by_id(cart_item.product_id)
            if product is None or product.status != "ACTIVE":
                raise BadRequestException(f"El producto con ID {cart_item.product_id} no está disponible")

            inventory = product.inventory
            if inventory is None or inventory.stock_quantity < cart_item.quantity:
                available = inventory.stock_quantity if inventory else 0
                raise BadRequestException(
                    f"Stock insuficiente para '{product.name}' (disponible: {available}, solicitado: {cart_item.quantity})"
                )

            product_cache[product.id] = product
            items_by_store.setdefault(product.store_id, []).append(
                {"product": product, "quantity": cart_item.quantity}
            )

        # 2. Crear la orden principal (sin order_number aún, se asigna tras flush)
        order = Order(
            order_number="PENDING",  # placeholder temporal, se actualiza tras obtener el ID
            customer_id=customer_id,
            total_amount=Decimal("0.00"),
            status=OrderStatus.PENDING.value,
            shipping_address=data.shipping_address,
            payment_method=data.payment_method.value,
        )
        self.repository.create(order)  # flush -> order.id disponible

        order_number = build_order_number(order.id)
        order.order_number = order_number

        # 3. Crear una suborden por cada tienda involucrada
        grand_total = Decimal("0.00")
        store_index = 0

        for store_id, store_items in items_by_store.items():
            store_index += 1

            subtotal = Decimal("0.00")
            line_items: list[OrderItem] = []

            for entry in store_items:
                product = entry["product"]
                quantity = entry["quantity"]
                unit_price = Decimal(product.price)
                line_total = (unit_price * quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                subtotal += line_total

                line_items.append(
                    OrderItem(
                        product_id=product.id,
                        product_name=product.name,
                        unit_price=unit_price,
                        quantity=quantity,
                        line_total=line_total,
                    )
                )

            tax_amount = (subtotal * TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total = subtotal + tax_amount
            grand_total += total

            store_order = StoreOrder(
                sub_order_number=build_sub_order_number(order_number, store_index),
                order_id=order.id,
                store_id=store_id,
                subtotal=subtotal,
                tax_amount=tax_amount,
                total=total,
                status=OrderStatus.PENDING.value,
            )
            self.repository.add_store_order(store_order)

            for item in line_items:
                item.store_order_id = store_order.id
                self.repository.add_order_item(item)

        order.total_amount = grand_total

        # 4. Registrar el pago simulado (siempre aprobado, sin pasarela real)
        payment = Payment(
            order_id=order.id,
            payment_method=data.payment_method.value,
            card_last_digits=data.card_last_digits,
            amount=grand_total,
            status=PaymentStatus.APPROVED.value,
            paid_at=datetime.now(timezone.utc),
        )
        self.repository.add_payment(payment)

        # La orden queda confirmada al aprobarse el pago simulado
        order.status = OrderStatus.CONFIRMED.value
        for store_order in order.store_orders:
            store_order.status = OrderStatus.CONFIRMED.value

        # 5. Descontar inventario e incrementar contador de ventas
        low_stock_alerts: list[tuple[int, object]] = []  # (store_id, product)
        for store_items in items_by_store.values():
            for entry in store_items:
                product = entry["product"]
                quantity = entry["quantity"]
                inventory = product.inventory
                inventory.stock_quantity -= quantity
                product.sales_count += quantity

                if inventory.stock_quantity <= inventory.min_stock:
                    low_stock_alerts.append((product.store_id, product))

        self.repository.commit()

        # 6. Notificar al administrador de cada tienda involucrada y al cliente
        db = self.repository.db
        for store_order in order.store_orders:
            store = self.store_repository.get_by_id(store_order.store_id)
            if store is not None:
                notify_user(
                    db,
                    user_id=store.admin_user_id,
                    title="Nuevo pedido recibido",
                    message=f"Has recibido un nuevo pedido {store_order.sub_order_number} en {store.business_name}.",
                    type_=NotificationType.ORDER,
                    reference_id=store_order.id,
                )

        notify_user(
            db,
            user_id=customer_id,
            title="Pedido confirmado",
            message=f"Tu pedido {order.order_number} ha sido confirmado y está siendo procesado.",
            type_=NotificationType.ORDER,
            reference_id=order.id,
        )

        # 7. Alertas de stock bajo para los administradores correspondientes
        for store_id, product in low_stock_alerts:
            store = self.store_repository.get_by_id(store_id)
            if store is not None:
                notify_user(
                    db,
                    user_id=store.admin_user_id,
                    title="Producto con stock bajo",
                    message=f"El producto '{product.name}' tiene stock bajo ({product.inventory.stock_quantity} unidades).",
                    type_=NotificationType.STORE,
                    reference_id=product.id,
                )

        refreshed = self.repository.get_by_id(order.id)
        return OrderResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Historial del cliente
    # -----------------------------------------------------------------

    def get_order_detail(self, customer_id: int, order_id: int) -> OrderResponse:
        order = self.repository.get_by_id(order_id)
        if order is None:
            raise ResourceNotFoundException("Orden no encontrada")

        if order.customer_id != customer_id:
            raise ForbiddenException("No tienes acceso a esta orden")

        return OrderResponse.model_validate(order)

    def list_my_orders(self, customer_id: int, page: int, size: int) -> PageResponse[OrderSummaryResponse]:
        offset = max(page - 1, 0) * size
        orders, total = self.repository.list_by_customer(customer_id, offset=offset, limit=size)
        items = [OrderSummaryResponse.model_validate(o) for o in orders]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    # -----------------------------------------------------------------
    # Gestión por Admin de Tienda
    # -----------------------------------------------------------------

    def list_store_orders(
        self, admin_user_id: int, status: OrderStatus | None, page: int, size: int
    ) -> PageResponse[StoreOrderListItemResponse]:
        store = self._get_store_or_404(admin_user_id)

        offset = max(page - 1, 0) * size
        status_value = status.value if status else None
        store_orders, total = self.repository.list_by_store(store.id, status=status_value, offset=offset, limit=size)

        items = [
            StoreOrderListItemResponse(
                id=so.id,
                sub_order_number=so.sub_order_number,
                order_number=so.order.order_number,
                customer_name=so.order.customer.full_name,
                subtotal=so.subtotal,
                tax_amount=so.tax_amount,
                total=so.total,
                status=so.status,
                items=[OrderItemResponse.model_validate(i) for i in so.items],
                created_at=so.created_at,
            )
            for so in store_orders
        ]
        return PageResponse.create(items, total, PageParams(page=page, size=size))

    def update_store_order_status(
        self, admin_user_id: int, store_order_id: int, data: UpdateStoreOrderStatusRequest
    ) -> StoreOrderResponse:
        store = self._get_store_or_404(admin_user_id)

        store_order = self.repository.get_store_order_by_id(store_order_id)
        if store_order is None:
            raise ResourceNotFoundException("Suborden no encontrada")

        if store_order.store_id != store.id:
            raise ForbiddenException("Esta suborden no pertenece a tu tienda")

        if store_order.status == OrderStatus.CANCELLED.value:
            raise BadRequestException("No se puede modificar una suborden cancelada")

        if store_order.status == OrderStatus.DELIVERED.value and data.status != OrderStatus.DELIVERED:
            raise BadRequestException("No se puede modificar una suborden ya entregada")

        store_order.status = data.status.value
        self.repository.commit()

        db = self.repository.db
        record_audit_log(
            db,
            user_id=admin_user_id,
            action="STORE_ORDER_STATUS_CHANGED",
            entity_type="STORE_ORDER",
            entity_id=store_order.id,
            details={"new_status": data.status.value},
        )
        notify_user(
            db,
            user_id=store_order.order.customer_id,
            title="Actualización de tu pedido",
            message=f"Tu pedido {store_order.sub_order_number} ahora está en estado {data.status.value}.",
            type_=NotificationType.ORDER,
            reference_id=store_order.id,
        )

        refreshed = self.repository.get_store_order_by_id(store_order_id)
        return StoreOrderResponse.model_validate(refreshed)

    # -----------------------------------------------------------------
    # Helpers internos
    # -----------------------------------------------------------------

    def _get_store_or_404(self, admin_user_id: int):
        store = self.store_repository.get_by_admin_user_id(admin_user_id)
        if store is None:
            raise ResourceNotFoundException("No tienes una tienda asignada")
        return store
