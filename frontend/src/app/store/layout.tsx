"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  Store, Ticket, MessageCircle, Bell, LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import NotificationDropdown from "@/components/shared/NotificationDropdown";

const navItems = [
  { href: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store/products", label: "Productos", icon: Package },
  { href: "/store/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/store/inventory", label: "Inventario", icon: Warehouse },
  { href: "/store/profile", label: "Mi Tienda", icon: Store },
  { href: "/store/tickets", label: "Tickets", icon: Ticket },
  { href: "/store/chat", label: "Chat", icon: MessageCircle },
  { href: "/store/notifications", label: "Notificaciones", icon: Bell },
];

export default function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetch = () => {
      api.get("/notifications/unread-count")
        .then((res) => setUnreadCount(res.data.data.unread_count || 0))
        .catch(console.error);
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden"
      >
        <div
          className={
            "px-3 py-4 border-b border-gray-100 flex items-center min-h-[72px] " +
            (collapsed ? "flex-col justify-center gap-2" : "justify-between px-4 py-5")
          }
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/arixLOGO.png"
              alt="ARIX"
              width={collapsed ? 28 : 34}
              height={collapsed ? 28 : 34}
              className="object-contain shrink-0 rounded-lg"
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0"
                >
                  <p className="text-lg font-bold text-[#1D1D1F] leading-tight">ARIX</p>
                  <p className="text-xs text-[#86868B] truncate">Admin de Tienda</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir" : "Colapsar"}
            className="p-2 rounded-xl hover:bg-gray-50 transition-colors text-[#86868B] hover:text-[#1D1D1F] shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const isNotif = href === "/store/notifications";
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative " + (active ? "bg-[#1D1D1F] text-white" : "text-[#86868B] hover:bg-gray-50 hover:text-[#1D1D1F]") + (collapsed ? " justify-center" : "")}
              >
                <Icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isNotif && unreadCount > 0 && (
                  <span className={"bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0 " + (collapsed ? "w-4 h-4 absolute -top-0.5 -right-0.5 text-[10px]" : "w-5 h-5")}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-[#F5F5F7] rounded-2xl p-3 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1D1D1F] truncate">{user?.full_name}</p>
                  <p className="text-xs text-[#86868B] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl text-[#86868B] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-9 h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center"
                  title={user?.full_name}
                >
                  <span className="text-white text-sm font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl text-[#86868B] hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <p className="text-sm text-[#86868B]">
            Hola, <span className="font-medium text-[#1D1D1F]">{user?.full_name?.split(" ")[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            <NotificationDropdown unreadCount={unreadCount} onCountChange={setUnreadCount} />
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors group"
            >
              <div className="w-7 h-7 bg-[#1D1D1F] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.full_name?.charAt(0).toUpperCase()}</span>
              </div>
              <LogOut size={14} className="text-[#86868B] group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}