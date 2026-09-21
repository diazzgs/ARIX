"use client";
import Logo from "@/components/shared/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Store,
  Users,
  Ticket,
  Star,
  ScrollText,
  Bell,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/stores", label: "Tiendas", icon: Store },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/reviews", label: "Reseñas", icon: Star },
  { href: "/admin/audit", label: "Auditoría", icon: ScrollText },
  { href: "/admin/notifications", label: "Notificaciones", icon: Bell },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100">
        <Logo size={40} showText={true} />
<p className="text-xs text-[#86868B] mt-0.5">Super Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}