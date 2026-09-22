"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { useState, useEffect } from "react";
import {
  ShoppingBag, Heart, User, Ticket,
  MessageCircle, Bell, LogOut, Store,
  ShoppingCart, ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const navItems = [
  { href: "/catalog", label: "Catálogo", icon: Store },
  { href: "/orders", label: "Mis Órdenes", icon: ShoppingBag },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/tickets", label: "Soporte", icon: Ticket },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/profile", label: "Mi Perfil", icon: User },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { items } = useCartStore();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    api.get("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data.data.unread_count || 0))
      .catch(console.error);
    const interval = setInterval(() => {
      api.get("/notifications/unread-count")
        .then((res) => setUnreadCount(res.data.data.unread_count || 0))
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden relative z-20"
      >
        {/* Logo + toggle */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between min-h-[72px]">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-lg font-bold text-[#1D1D1F]">ARIX</p>
                <p className="text-xs text-[#86868B]">Mi cuenta</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-gray-50 transition-colors text-[#86868B] hover:text-[#1D1D1F] ml-auto"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors " + (active ? "bg-[#1D1D1F] text-white" : "text-[#86868B] hover:bg-gray-50 hover:text-[#1D1D1F]") + (collapsed ? " justify-center" : "")}
              >
                <Icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className={"px-3 py-4 border-t border-gray-100 " + (collapsed ? "flex flex-col items-center gap-2" : "")}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <p className="text-xs font-medium text-[#1D1D1F] truncate">{user?.full_name}</p>
                <p className="text-xs text-[#86868B] truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={logout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={"flex items-center gap-2 text-sm text-[#86868B] hover:text-red-500 transition-colors " + (collapsed ? "justify-center p-2 rounded-xl hover:bg-red-50 w-full" : "")}
          >
            <LogOut size={16} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header flotante */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <p className="text-sm text-[#86868B]">
            Hola, <span className="font-medium text-[#1D1D1F]">{user?.full_name?.split(" ")[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-[#86868B] hover:text-[#1D1D1F]"
              title="Notificaciones"
            >
              <Bell size={18} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Carrito */}
            <Link
              href="/checkout"
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-[#86868B] hover:text-[#1D1D1F]"
              title="Carrito"
            >
              <ShoppingCart size={18} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 bg-[#1D1D1F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Avatar + cerrar sesión */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors group"
              title="Cerrar sesión"
            >
              <div className="w-7 h-7 bg-[#1D1D1F] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <LogOut size={14} className="text-[#86868B] group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}