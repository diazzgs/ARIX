"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, UserCircle } from "lucide-react";
import api from "@/lib/api";

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  status: string;
  role: { name: string };
  created_at: string;
}

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/users?size=50")
      .then((res) => setUsers(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
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

      {loading ? (
        <p className="text-[#86868B]">Cargando usuarios...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Usuario</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Rol</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#F5F5F7] rounded-full flex items-center justify-center">
                        <UserCircle size={20} className="text-[#86868B]" />
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}