"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import api from "@/lib/api";

interface StoreItem {
  id: number;
  business_name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  admin: { full_name: string; email: string } | null;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stores?size=50")
      .then((res) => setStores(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status: string) => {
    if (status === "ACTIVE") return "bg-green-100 text-green-700";
    if (status === "SUSPENDED") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Tiendas</h1>
          <p className="text-[#86868B] mt-1">Gestiona las tiendas de la plataforma</p>
        </div>
        <Link
          href="/admin/stores/new"
          className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Nueva tienda
        </Link>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando tiendas...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Tienda</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Administrador</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#F5F5F7] rounded-xl flex items-center justify-center">
                        <Store size={16} className="text-[#86868B]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1D1D1F]">{store.business_name}</p>
                        <p className="text-xs text-[#86868B]">{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {store.admin ? (
                      <div>
                        <p className="text-sm text-[#1D1D1F]">{store.admin.full_name}</p>
                        <p className="text-xs text-[#86868B]">{store.admin.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#86868B]">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(store.status)}`}>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/stores/${store.id}`}
                      className="text-sm text-[#1D1D1F] font-medium hover:underline"
                    >
                      Ver detalle
                    </Link>
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