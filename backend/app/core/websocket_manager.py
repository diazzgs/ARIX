"""
=====================================================================
ARIX BACKEND - Gestor de conexiones WebSocket (Chat)
=====================================================================
Mantiene un registro en memoria de las conexiones WebSocket activas
por usuario, y permite enviar mensajes a un usuario específico si
está conectado (push en tiempo real).

NOTA: esta implementación es para un único proceso/instancia del
servidor. Para despliegues con múltiples instancias se requeriría
un backend de pub/sub compartido (ej. Redis).
=====================================================================
"""

from fastapi import WebSocket


class ConnectionManager:
    """Administra las conexiones WebSocket activas, indexadas por user_id."""

    def __init__(self):
        # Un usuario puede tener varias conexiones (ej. varias pestañas)
        self._connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if connections is None:
            return

        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        """Envía un payload JSON a todas las conexiones activas de un usuario."""
        connections = self._connections.get(user_id)
        if not connections:
            return

        stale: list[WebSocket] = []
        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)

        for websocket in stale:
            connections.discard(websocket)

    def is_connected(self, user_id: int) -> bool:
        return bool(self._connections.get(user_id))


# Instancia global compartida por toda la aplicación
connection_manager = ConnectionManager()
