"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface StoreDetail {
  id: number;
  business_name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  status: string;
  admin: { full_name: string; email: string } | null;
  profile: {
    tagline: string | null;
    tax_id: string | null;
    social_facebook: string | null;
    social_instagram: string | null;
    social_website: string | null;
  } | null;
}

export default function AdminStoreDetailPage() {
  const { storeId } = useParams();
  const router = useRouter();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get("/admin/stores/" + storeId)
      .then((res) => setStore(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storeId]);

  const toggleStatus = async () => {
    if (!store) return;
    setUpdating(true);
    const newStatus = store.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.put("/admin/stores/" + storeId + "/status", { status: newStatus });
      setStore({ ...store, status: newStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const deleteStore = async () => {
    if (!confirm("¿Estás seguro de eliminar esta tienda?")) return;
    await api.delete("/admin/stores/" + storeId);
    router.push("/admin/stores");
  };

  if (loading) return <p className="text-[#86868B]">Cargando tienda...</p>;
  if (!store) return <p className="text-red-500">Tienda no encontrada</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/stores" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-6 inline-block">
        ← Tiendas
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">{store.business_name}</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleStatus}
            disabled={updating}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              store.status === "ACTIVE"
                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {store.status === "ACTIVE" ? "Suspender" : "Reactivar"}
          </button>
          <button
            onClick={deleteStore}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-medium text-[#1D1D1F] mb-4">Información general</h2>
          <div className="space-y-3">
            {[
              { label: "Slug", value: store.slug },
              { label: "Estado", value: store.status },
              { label: "Correo", value: store.contact_email || "—" },
              { label: "Teléfono", value: store.contact_phone || "—" },
              { label: "Dirección", value: store.contact_address || "—" },
              { label: "Descripción", value: store.description || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[#86868B]">{label}</span>
                <span className="text-sm text-[#1D1D1F] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-medium text-[#1D1D1F] mb-4">Administrador</h2>
          {store.admin ? (
            <div className="space-y-2">
              <p className="text-sm text-[#1D1D1F] font-medium">{store.admin.full_name}</p>
              <p className="text-sm text-[#86868B]">{store.admin.email}</p>
            </div>
          ) : (
            <p className="text-sm text-[#86868B]">Sin administrador asignado</p>
          )}
        </div>

        {store.profile && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-medium text-[#1D1D1F] mb-4">Perfil extendido</h2>
            <div className="space-y-3">
              {[
                { label: "Eslogan", value: store.profile.tagline },
                { label: "RTN", value: store.profile.tax_id },
                { label: "Facebook", value: store.profile.social_facebook },
                { label: "Instagram", value: store.profile.social_instagram },
                { label: "Sitio web", value: store.profile.social_website },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-[#86868B]">{label}</span>
                  <span className="text-sm text-[#1D1D1F]">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}