"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import {
  ShoppingBag,
  Heart,
  User,
  Ticket,
  MessageCircle,
  Bell,
  LogOut,
  Store,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  { href: "/catalog", label: "Catálogo", icon: Store },
  { href: "/orders", label: "Mis Órdenes", icon: ShoppingBag },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/tickets", label: "Soporte", icon: Ticket },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/profile", label: "Mi Perfil", icon: User },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { items } = useCartStore();
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo + carrito */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[#1D1D1F]">ARIX</p>
            <p className="text-xs text-[#86868B]">Mi cuenta</p>
          </div>
          <Link href="/checkout" className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ShoppingCart size={20} className="text-[#1D1D1F]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1D1D1F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1D1D1F] text-white"
                    : "text-[#86868B] hover:bg-gray-50 hover:text-[#1D1D1F]"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-[#1D1D1F] truncate">{user?.full_name}</p>
          <p className="text-xs text-[#86868B] truncate mb-3">{user?.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-[#86868B] hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}