"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface AdminUser {
  id: number;
  full_name: string;
  email: string;
}

export default function NewStorePage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [form, setForm] = useState({
    business_name: "",
    slug: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    admin_user_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/users?role=ROLE_STORE_ADMIN&size=50")
      .then((res) => setAdmins(res.data.data.content))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "business_name" ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/admin/stores", {
        ...form,
        admin_user_id: form.admin_user_id ? Number(form.admin_user_id) : null,
      });
      router.push("/admin/stores");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al crear la tienda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/stores" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-6 inline-block">
        ← Tiendas
      </Link>
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Nueva tienda</h1>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Información de la tienda</h2>

          {[
            { label: "Nombre comercial", name: "business_name", required: true },
            { label: "Slug (URL)", name: "slug", required: true },
            { label: "Correo de contacto", name: "contact_email", required: false },
            { label: "Teléfono", name: "contact_phone", required: false },
            { label: "Dirección", name: "contact_address", required: false },
          ].map(({ label, name, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
              Administrador asignado <span className="text-[#86868B]">(opcional)</span>
            </label>
            <select
              name="admin_user_id"
              value={form.admin_user_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Sin asignar por ahora</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name} — {admin.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? "Creando tienda..." : "Crear tienda"}
        </button>
      </form>
    </div>
  );
}