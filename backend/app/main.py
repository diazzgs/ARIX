"""
=====================================================================
ARIX BACKEND - Punto de entrada de la aplicación
=====================================================================
Inicializa la aplicación FastAPI, configura CORS, registra los
manejadores de excepciones y monta los routers de cada módulo.

Ejecutar en desarrollo:
    uvicorn app.main:app --reload --port 8080
=====================================================================
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.common.exceptions.handlers import register_exception_handlers

# ---------------------------------------------------------------------
# Instancia principal de la aplicación
# ---------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="ARIX - Plataforma SaaS Marketplace Multi-Tienda. API REST.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------
# CORS - permite que el frontend (Next.js en localhost:3000) consuma la API
# ---------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Manejadores globales de excepciones
# ---------------------------------------------------------------------
register_exception_handlers(app)

# ---------------------------------------------------------------------
# Archivos estáticos (imágenes de productos, tiendas, avatares, facturas)
# ---------------------------------------------------------------------
upload_dir = Path(settings.UPLOAD_DIR)
for subfolder in ("avatars", "stores", "products", "invoices"):
    (upload_dir / subfolder).mkdir(parents=True, exist_ok=True)

app.mount("/api/files", StaticFiles(directory=settings.UPLOAD_DIR), name="files")

# ---------------------------------------------------------------------
# Routers de módulos
# NOTA: se irán descomentando/agregando a medida que se implemente
# cada módulo (stores, products, orders, etc.).
# ---------------------------------------------------------------------
from app.modules.users.router import router as users_router
from app.modules.stores.router import router as stores_router
from app.modules.products.router import router as products_router
from app.modules.categories.router import router as categories_router
from app.modules.inventory.router import router as inventory_router
from app.modules.orders.router import router as orders_router
from app.modules.invoices.router import router as invoices_router
from app.modules.reviews.router import router as reviews_router
from app.modules.favorites.router import router as favorites_router
from app.modules.tickets.router import router as tickets_router
from app.modules.chat.router import router as chat_router
from app.modules.notifications.router import router as notifications_router
from app.modules.audit.router import router as audit_router

app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(stores_router, prefix=settings.API_PREFIX)
app.include_router(products_router, prefix=settings.API_PREFIX)
app.include_router(categories_router, prefix=settings.API_PREFIX)
app.include_router(inventory_router, prefix=settings.API_PREFIX)
app.include_router(orders_router, prefix=settings.API_PREFIX)
app.include_router(invoices_router, prefix=settings.API_PREFIX)
app.include_router(reviews_router, prefix=settings.API_PREFIX)
app.include_router(favorites_router, prefix=settings.API_PREFIX)
app.include_router(tickets_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Endpoint simple para verificar que la API está corriendo."""
    return {
        "success": True,
        "message": "ARIX API funcionando correctamente",
        "environment": settings.APP_ENV,
    }
