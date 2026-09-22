"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Lock, CheckCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import Toast from "@/components/shared/Toast";
import PageTransition from "@/components/shared/PageTransition";
import AvatarUpload from "@/components/shared/AvatarUpload";

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/users/me", form);
      updateUser(res.data.data);
      setToast({ visible: true, message: "✓ Perfil actualizado correctamente" });
    } catch {
      setToast({ visible: true, message: "Error al actualizar el perfil" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      await api.put("/users/me/password", passwordForm);
      setPasswordForm({ current_password: "", new_password: "" });
      setToast({ visible: true, message: "✓ Contraseña actualizada correctamente" });
    } catch {
      setToast({ visible: true, message: "Error al cambiar la contraseña" });
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <Toast
          message={toast.message}
          visible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-[#1D1D1F] mb-8"
        >
          Mi Perfil
        </motion.h1>

        {/* Avatar y datos rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex items-center gap-5"
        >
          <AvatarUpload
            imageUrl={user?.profile_image_url}
            initials={initials}
            size={64}
            onUploaded={(url) => {
              if (user) updateUser({ ...user, profile_image_url: url });
              setToast({ visible: true, message: "✓ Foto de perfil actualizada correctamente" });
            }}
          />
          <div className="flex-1">
            <p className="text-lg font-bold text-[#1D1D1F]">{user?.full_name}</p>
            <p className="text-sm text-[#86868B]">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">Cuenta activa</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#86868B]">Rol</p>
            <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
              <ShieldCheck size={12} />
              Super Admin
            </span>
          </div>
        </motion.div>

        {/* Info personal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-4"
        >
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-[#86868B]" />
            <h2 className="font-medium text-[#1D1D1F]">Información personal</h2>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Nombre completo
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-[#86868B] cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-[#86868B] mt-1">El correo no se puede cambiar</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Teléfono
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+504 9999-0000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Dirección
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ciudad, País"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </motion.button>
          </form>
        </motion.div>

        {/* Cambiar contraseña */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-[#86868B]" />
            <h2 className="font-medium text-[#1D1D1F]">Cambiar contraseña</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Contraseña actual
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#86868B] mb-1.5 uppercase tracking-wide">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={pwLoading}
              className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {pwLoading ? "Cambiando..." : "Cambiar contraseña"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}