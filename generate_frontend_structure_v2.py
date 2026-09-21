"""
=====================================================================
ARIX FRONTEND - Generador de estructura corregida para Next.js 16
=====================================================================
Usa prefijos de URL por rol para evitar conflictos de rutas paralelas.

Rutas resultantes:
  /                    -> Landing pública
  /login               -> Login
  /register            -> Registro
  /catalog             -> Catálogo público
  /stores              -> Tiendas públicas
  /dashboard           -> Dashboard del cliente
  /store/dashboard     -> Dashboard del admin de tienda
  /admin/dashboard     -> Dashboard del super admin

USO:
    python generate_frontend_structure_v2.py

Ejecutar desde la carpeta raíz ARIX.
=====================================================================
"""

import os
import shutil

FRONTEND_SRC = os.path.join("frontend", "src")
APP_DIR = os.path.join(FRONTEND_SRC, "app")

FILES = {
    # --- Layout raíz ---
    "app/layout.tsx": "",
    "app/globals.css": "",
    "app/not-found.tsx": "",

    # --- Autenticación ---
    "app/(auth)/layout.tsx": "",
    "app/(auth)/login/page.tsx": "",
    "app/(auth)/register/page.tsx": "",
    "app/(auth)/forgot-password/page.tsx": "",
    "app/(auth)/reset-password/page.tsx": "",

    # --- Páginas públicas ---
    "app/(public)/layout.tsx": "",
    "app/(public)/page.tsx": "",
    "app/(public)/catalog/page.tsx": "",
    "app/(public)/catalog/[productId]/page.tsx": "",
    "app/(public)/stores/page.tsx": "",
    "app/(public)/stores/[slug]/page.tsx": "",

    # --- Cliente (prefijo /dashboard, /orders, /favorites, etc.) ---
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

    # --- Admin de Tienda (prefijo /store/...) ---
    "app/store/layout.tsx": "",
    "app/store/dashboard/page.tsx": "",
    "app/store/products/page.tsx": "",
    "app/store/products/new/page.tsx": "",
    "app/store/products/[productId]/edit/page.tsx": "",
    "app/store/orders/page.tsx": "",
    "app/store/orders/[orderId]/page.tsx": "",
    "app/store/inventory/page.tsx": "",
    "app/store/profile/page.tsx": "",
    "app/store/tickets/page.tsx": "",
    "app/store/tickets/[ticketId]/page.tsx": "",
    "app/store/chat/page.tsx": "",
    "app/store/notifications/page.tsx": "",

    # --- Super Admin (prefijo /admin/...) ---
    "app/admin/layout.tsx": "",
    "app/admin/dashboard/page.tsx": "",
    "app/admin/stores/page.tsx": "",
    "app/admin/stores/new/page.tsx": "",
    "app/admin/stores/[storeId]/page.tsx": "",
    "app/admin/users/page.tsx": "",
    "app/admin/users/new-admin/page.tsx": "",
    "app/admin/tickets/page.tsx": "",
    "app/admin/tickets/[ticketId]/page.tsx": "",
    "app/admin/reviews/page.tsx": "",
    "app/admin/audit/page.tsx": "",
    "app/admin/notifications/page.tsx": "",

    # --- Tipos ---
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

    # --- API ---
    "lib/api.ts": "",

    # --- Store Zustand ---
    "store/auth.store.ts": "",
    "store/cart.store.ts": "",
    "store/notification.store.ts": "",

    # --- Servicios ---
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

    # --- Hooks ---
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
}


def create_structure():
    created = 0
    skipped = 0

    for relative_path, content in FILES.items():
        full_path = os.path.join(FRONTEND_SRC, relative_path)

        if os.path.exists(full_path):
            skipped += 1
            continue

        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        created += 1

    print(f"\n✅ Estructura del frontend ARIX (v2) generada.")
    print(f"   Archivos creados : {created}")
    print(f"   Archivos omitidos (ya existían): {skipped}")
    print(f"\nEstructura de URLs:")
    print("   /               -> Landing pública")
    print("   /login          -> Login")
    print("   /catalog        -> Catálogo")
    print("   /dashboard      -> Cliente")
    print("   /store/...      -> Admin de Tienda")
    print("   /admin/...      -> Super Admin")


if __name__ == "__main__":
    create_structure()
