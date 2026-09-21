"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1D1D1F]">ARIX</h1>
        <p className="text-[#86868B] mt-1 text-sm">Crea tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Teléfono <span className="text-[#86868B]">(opcional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="+504 9999-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Dirección <span className="text-[#86868B]">(opcional)</span>
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="Ciudad, País"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl font-medium text-sm hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#86868B]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#1D1D1F] font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}