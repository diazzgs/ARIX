"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowUpDown, CheckCircle2, Ban, PauseCircle } from "lucide-react";
import api, { getFileUrl } from "@/lib/api";
import Toast from "@/components/shared/Toast";

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  status: string;
  profile_image_url: string | null;
  role: { name: string };
  created_at: string;
}

const isCustomAvatar = (url: string | null | undefined): url is string =>
  !!url && url.startsWith("/api/files/");

const roleLabel = (role: string) => {
  if (role === "ROLE_SUPER_ADMIN") return "Super Admin";
  if (role === "ROLE_STORE_ADMIN") return "Admin Tienda";
  return "Cliente";
};

const roleColor = (role: string) => {
  if (role === "ROLE_SUPER_ADMIN") return "bg-purple-100 text-purple-700";
  if (role === "ROLE_STORE_ADMIN") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
};

const statusColor = (status: string) => {
  if (status === "ACTIVE") return "bg-green-100 text-green-700";
  if (status === "BLOCKED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

const statusActions: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ACTIVE: { label: "Activar", icon: CheckCircle2, className: "bg-green-50 text-green-700 hover:bg-green-100" },
  BLOCKED: { label: "Bloquear", icon: Ban, className: "bg-red-50 text-red-700 hover:bg-red-100" },
  SUSPENDED: { label: "Suspender", icon: PauseCircle, className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ size: "50", sort_by: sortBy, sort_dir: sortDir });
      if (search.trim()) params.set("search", search.trim());
      if (role) params.set("role", role);
      if (status) params.set("status", status);

      api.get("/admin/users?" + params.toString())
        .then((res) => setUsers(res.data.data.content))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, role, status, sortBy, sortDir]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const updateStatus = async (userId: number, newStatus: string) => {
    setUpdatingId(userId);
    try {
      await api.put("/admin/users/" + userId + "/status", { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      setToast({ visible: true, message: "✓ Estado del usuario actualizado" });
    } catch {
      setToast({ visible: true, message: "Error al actualizar el estado del usuario" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Usuarios</h1>
          <p className="text-[#86868B] mt-1">Gestiona los usuarios de la plataforma</p>
        </div>
        <Link
          href="/admin/users/new-admin"
          className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Nuevo admin
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
        >
          <option value="">Todos los roles</option>
          <option value="ROLE_CLIENT">Cliente</option>
          <option value="ROLE_STORE_ADMIN">Admin Tienda</option>
          <option value="ROLE_SUPER_ADMIN">Super Admin</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="SUSPENDED">Suspendido</option>
          <option value="BLOCKED">Bloqueado</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No se encontraron usuarios con esos filtros</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => toggleSort("full_name")}
                    className="flex items-center gap-1 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  >
                    Usuario
                    <ArrowUpDown size={12} className={sortBy === "full_name" ? "text-[#1D1D1F]" : ""} />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Rol</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  >
                    Registro
                    <ArrowUpDown size={12} className={sortBy === "created_at" ? "text-[#1D1D1F]" : ""} />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1D1D1F] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {isCustomAvatar(user.profile_image_url) ? (
                          <img src={getFileUrl(user.profile_image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1D1D1F]">{user.full_name}</p>
                        <p className="text-xs text-[#86868B]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColor(user.role.name)}`}>
                      {roleLabel(user.role.name)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#86868B]">
                      {new Date(user.created_at).toLocaleDateString("es-HN")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Object.entries(statusActions)
                        .filter(([key]) => key !== user.status)
                        .map(([key, { label, icon: Icon, className }]) => (
                          <button
                            key={key}
                            onClick={() => updateStatus(user.id, key)}
                            disabled={updatingId === user.id}
                            title={label}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${className}`}
                          >
                            <Icon size={12} />
                            {label}
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}