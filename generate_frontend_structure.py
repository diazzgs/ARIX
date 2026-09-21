"""
=====================================================================
ARIX FRONTEND - Generador de estructura de proyecto
=====================================================================
Genera todas las carpetas y archivos vacíos del frontend Next.js
de ARIX dentro de la carpeta "frontend/src".

USO:
    python generate_frontend_structure.py

Ejecutar desde la carpeta raíz ARIX (donde están backend y frontend).
=====================================================================
"""

import os

FRONTEND_SRC = os.path.join("frontend", "src")

# ---------------------------------------------------------------------
# Archivos a crear con su contenido inicial
# ---------------------------------------------------------------------
FILES = {
    # --- Tipos globales ---
    "types/index.ts": "",
    "types/auth.ts": "",
    "types/user.ts": "",
    "types/store.ts": "",
    "types/product.ts": "",
    "types/order.ts": "",
    "types/invoice.ts": "",
    "types/review.ts": "",
    "types/ticket.ts": "",
    "types/chat.ts": "",
    "types/notification.ts": "",

    # --- Constantes ---
    "constants/index.ts": "",
    "constants/routes.ts": "",

    # --- Configuración de API (axios) ---
    "lib/api.ts": "",
    "lib/utils.ts": "",  # ya existe, se omite si existe

    # --- Store global (Zustand) ---
    "store/auth.store.ts": "",
    "store/cart.store.ts": "",
    "store/notification.store.ts": "",

    # --- Servicios (llamadas a la API) ---
    "services/auth.service.ts": "",
    "services/user.service.ts": "",
    "services/store.service.ts": "",
    "services/product.service.ts": "",
    "services/category.service.ts": "",
    "services/order.service.ts": "",
    "services/invoice.service.ts": "",
    "services/review.service.ts": "",
    "services/favorite.service.ts": "",
    "services/ticket.service.ts": "",
    "services/chat.service.ts": "",
    "services/notification.service.ts": "",

    # --- Hooks personalizados ---
    "hooks/useAuth.ts": "",
    "hooks/useCart.ts": "",
    "hooks/useNotifications.ts": "",

    # --- Componentes compartidos ---
    "components/shared/Navbar.tsx": "",
    "components/shared/Footer.tsx": "",
    "components/shared/Sidebar.tsx": "",
    "components/shared/Logo.tsx": "",
    "components/shared/LoadingSpinner.tsx": "",
    "components/shared/EmptyState.tsx": "",
    "components/shared/PageHeader.tsx": "",
    "components/shared/ConfirmDialog.tsx": "",
    "components/shared/NotificationBell.tsx": "",

    # --- Componentes de catálogo ---
    "components/catalog/ProductCard.tsx": "",
    "components/catalog/ProductGrid.tsx": "",
    "components/catalog/ProductFilters.tsx": "",
    "components/catalog/SearchBar.tsx": "",
    "components/catalog/CategoryMenu.tsx": "",
    "components/catalog/StoreCard.tsx": "",

    # --- Componentes de carrito ---
    "components/cart/CartDrawer.tsx": "",
    "components/cart/CartItem.tsx": "",
    "components/cart/CartSummary.tsx": "",

    # --- Componentes de checkout ---
    "components/checkout/CheckoutForm.tsx": "",
    "components/checkout/PaymentForm.tsx": "",
    "components/checkout/OrderSummary.tsx": "",

    # --- Componentes de dashboard ---
    "components/dashboard/StatCard.tsx": "",
    "components/dashboard/RecentOrders.tsx": "",
    "components/dashboard/SalesChart.tsx": "",
    "components/dashboard/LowStockAlert.tsx": "",

    # --- Componentes de chat ---
    "components/chat/ChatWindow.tsx": "",
    "components/chat/ChatMessage.tsx": "",
    "components/chat/ChatList.tsx": "",

    # --- Componentes de tickets ---
    "components/tickets/TicketCard.tsx": "",
    "components/tickets/TicketMessages.tsx": "",

    # --- Providers ---
    "providers/AuthProvider.tsx": "",
    "providers/ThemeProvider.tsx": "",
    "providers/QueryProvider.tsx": "",

    # =====================================================================
    # PÁGINAS (App Router de Next.js)
    # =====================================================================

    # --- Página pública raíz ---
    "app/(public)/layout.tsx": "",
    "app/(public)/page.tsx": "",                          # Landing / Home

    # --- Autenticación ---
    "app/(auth)/layout.tsx": "",
    "app/(auth)/login/page.tsx": "",
    "app/(auth)/register/page.tsx": "",
    "app/(auth)/forgot-password/page.tsx": "",
    "app/(auth)/reset-password/page.tsx": "",

    # --- Catálogo público ---
    "app/(public)/catalog/page.tsx": "",
    "app/(public)/catalog/[productId]/page.tsx": "",
    "app/(public)/stores/page.tsx": "",
    "app/(public)/stores/[slug]/page.tsx": "",

    # --- Cliente ---
    "app/(client)/layout.tsx": "",
    "app/(client)/dashboard/page.tsx": "",
    "app/(client)/orders/page.tsx": "",
    "app/(client)/orders/[orderId]/page.tsx": "",
    "app/(client)/favorites/page.tsx": "",
    "app/(client)/profile/page.tsx": "",
    "app/(client)/checkout/page.tsx": "",
    "app/(client)/tickets/page.tsx": "",
    "app/(client)/tickets/[ticketId]/page.tsx": "",
    "app/(client)/chat/page.tsx": "",
    "app/(client)/notifications/page.tsx": "",

    # --- Admin de Tienda ---
    "app/(store-admin)/layout.tsx": "",
    "app/(store-admin)/dashboard/page.tsx": "",
    "app/(store-admin)/products/page.tsx": "",
    "app/(store-admin)/products/new/page.tsx": "",
    "app/(store-admin)/products/[productId]/edit/page.tsx": "",
    "app/(store-admin)/orders/page.tsx": "",
    "app/(store-admin)/orders/[storeOrderId]/page.tsx": "",
    "app/(store-admin)/inventory/page.tsx": "",
    "app/(store-admin)/store-profile/page.tsx": "",
    "app/(store-admin)/tickets/page.tsx": "",
    "app/(store-admin)/tickets/[ticketId]/page.tsx": "",
    "app/(store-admin)/chat/page.tsx": "",
    "app/(store-admin)/notifications/page.tsx": "",

    # --- Super Admin ---
    "app/(super-admin)/layout.tsx": "",
    "app/(super-admin)/dashboard/page.tsx": "",
    "app/(super-admin)/stores/page.tsx": "",
    "app/(super-admin)/stores/new/page.tsx": "",
    "app/(super-admin)/stores/[storeId]/page.tsx": "",
    "app/(super-admin)/users/page.tsx": "",
    "app/(super-admin)/users/new-admin/page.tsx": "",
    "app/(super-admin)/tickets/page.tsx": "",
    "app/(super-admin)/tickets/[ticketId]/page.tsx": "",
    "app/(super-admin)/reviews/page.tsx": "",
    "app/(super-admin)/audit/page.tsx": "",
    "app/(super-admin)/notifications/page.tsx": "",

    # --- API routes (Next.js) ---
    "app/api/auth/[...nextauth]/route.ts": "",
}


def create_structure():
    created = 0
    skipped = 0

    for relative_path, content in FILES.items():
        full_path = os.path.join(FRONTEND_SRC, relative_path)

        # No sobreescribir archivos que ya existan (ej. globals.css, layout.tsx raíz)
        if os.path.exists(full_path):
            skipped += 1
            continue

        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        created += 1

    print(f"\n✅ Estructura del frontend ARIX generada.")
    print(f"   Archivos creados : {created}")
    print(f"   Archivos omitidos (ya existían): {skipped}")
    print(f"\nUbicación: {os.path.abspath(FRONTEND_SRC)}")


if __name__ == "__main__":
    create_structure()
