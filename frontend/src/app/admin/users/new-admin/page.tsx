"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function NewAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/admin/users/store-admins", form);
      router.push("/admin/users");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al crear el administrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/users" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-6 inline-block">
        ← Usuarios
      </Link>
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Nuevo administrador de tienda</h1>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {[
          { label: "Nombre completo", name: "full_name", type: "text", required: true },
          { label: "Correo electrónico", name: "email", type: "email", required: true },
          { label: "Contraseña", name: "password", type: "password", required: true },
          { label: "Teléfono", name: "phone", type: "tel", required: false },
          { label: "Dirección", name: "address", type: "text", required: false },
        ].map(({ label, name, type, required }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">{label}</label>
            <input
              type={type}
              value={form[name as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              required={required}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Creando..." : "Crear administrador"}
        </button>
      </form>
    </div>
  );
}