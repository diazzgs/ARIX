"""
=====================================================================
ARIX BACKEND - Utilidades: Generación de números de orden
=====================================================================
Genera identificadores legibles para órdenes y subórdenes,
con el formato:
    Orden principal:  ORD-1001
    Suborden:         ORD-1001-1, ORD-1001-2, ...
=====================================================================
"""

ORDER_NUMBER_PREFIX = "ORD"
ORDER_NUMBER_START = 1000


def build_order_number(sequence_id: int) -> str:
    """
    Construye el número de orden principal a partir del ID autoincremental.

    Ejemplo: sequence_id=1 -> "ORD-1001"
    """
    return f"{ORDER_NUMBER_PREFIX}-{ORDER_NUMBER_START + sequence_id}"


def build_sub_order_number(order_number: str, store_index: int) -> str:
    """
    Construye el número de suborden a partir del número de orden principal
    y el índice (1-based) de la tienda dentro de esa orden.

    Ejemplo: order_number="ORD-1001", store_index=1 -> "ORD-1001-1"
    """
    return f"{order_number}-{store_index}"
