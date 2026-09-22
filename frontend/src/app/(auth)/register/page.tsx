"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, MapPin, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const fields = [
  { name: "full_name", label: "Nombre completo", type: "text", icon: User, placeholder: "Juan Pérez", required: true },
  { name: "email", label: "Correo electrónico", type: "email", icon: Mail, placeholder: "correo@ejemplo.com", required: true },
  { name: "password", label: "Contraseña", type: "password", icon: Lock, placeholder: "Mínimo 8 caracteres", required: true },
  { name: "phone", label: "Teléfono", type: "tel", icon: Phone, placeholder: "+504 9999-0000", required: false },
  { name: "address", label: "Dirección", type: "text", icon: MapPin, placeholder: "Ciudad, País", required: false },
] as const;

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
          <UserPlus size={22} className="text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Crea tu cuenta</h1>
        <p className="text-[#86868B] mt-1 text-sm">Únete al marketplace ARIX</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ name, label, type, icon: Icon, placeholder, required }, index) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 + index * 0.05, duration: 0.35 }}
          >
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
              {label} {!required && <span className="normal-case text-[#86868B] font-normal">(opcional)</span>}
            </label>
            <div className="relative">
              <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={required}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                placeholder={placeholder}
              />
            </div>
          </motion.div>
        ))}

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
          transition={{ delay: 0.45, duration: 0.35 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-xl font-medium text-sm hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </motion.button>
      </form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-sm text-[#86868B]"
      >
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#1D1D1F] font-medium hover:underline">
          Inicia sesión
        </Link>
      </motion.p>
    </motion.div>
  );
}