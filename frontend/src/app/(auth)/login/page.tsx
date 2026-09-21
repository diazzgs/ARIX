"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1D1D1F]">ARIX</h1>
        <p className="text-[#86868B] mt-1 text-sm">Inicia sesión en tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            placeholder="••••••••"
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
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-sm text-[#86868B]">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#1D1D1F] font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}