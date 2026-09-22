"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8 border border-gray-100"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="w-14 h-14 bg-[#1D1D1F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
        >
          <LogIn size={22} className="text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Bienvenido de vuelta</h1>
        <p className="text-[#86868B] mt-1 text-sm">Inicia sesión en tu cuenta ARIX</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.23, duration: 0.35 }}
        >
          <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-xl"
          >
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-xl font-medium text-sm hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </motion.button>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 text-center space-y-2"
      >
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
      </motion.div>
    </motion.div>
  );
}