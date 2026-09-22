"use client";

import { useEffect, useRef, useState } from "react";
import { Store, Mail, Phone, MapPin, Zap, Globe, FileText, Building2, Camera, Loader2 } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";
import api, { getFileUrl } from "@/lib/api";
import Toast from "@/components/shared/Toast";
import PageTransition from "@/components/shared/PageTransition";

const isCustomImage = (url: string | null | undefined): url is string =>
  !!url && url.startsWith("/api/files/");

interface StoreData {
  id: number;
  business_name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  status: string;
  logo_url: string | null;
  profile: {
    tagline: string | null;
    about: string | null;
    social_facebook: string | null;
    social_instagram: string | null;
    social_website: string | null;
    tax_id: string | null;
  } | null;
}

export default function StoreProfilePage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
  });
  const [profileForm, setProfileForm] = useState({
    tagline: "",
    about: "",
    social_facebook: "",
    social_instagram: "",
    social_website: "",
    tax_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    api.get("/store/me")
      .then((res) => {
        const s = res.data.data;
        setStore(s);
        setForm({
          business_name: s.business_name || "",
          description: s.description || "",
          contact_email: s.contact_email || "",
          contact_phone: s.contact_phone || "",
          contact_address: s.contact_address || "",
        });
        setProfileForm({
          tagline: s.profile?.tagline || "",
          about: s.profile?.about || "",
          social_facebook: s.profile?.social_facebook || "",
          social_instagram: s.profile?.social_instagram || "",
          social_website: s.profile?.social_website || "",
          tax_id: s.profile?.tax_id || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/store/me/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStore(res.data.data);
      setToast({ visible: true, message: "✓ Logo actualizado correctamente" });
    } catch {
      setToast({ visible: true, message: "Error al subir el logo" });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.put("/store/me", form),
        api.put("/store/me/profile", profileForm),
      ]);
      setToast({ visible: true, message: "✓ Tienda actualizada correctamente" });
    } catch {
      setToast({ visible: true, message: "Error al guardar los cambios" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="bg-white rounded-2xl h-40 shadow-sm"
        />
      ))}
    </div>
  );

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black";
  const labelClass = "block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5";

  return (
    <PageTransition>
      <div>
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

        {/* Hero banner de la tienda */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1D1D1F] rounded-3xl p-8 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-32 h-32 bg-white rounded-full" />
            <div className="absolute bottom-4 right-24 w-16 h-16 bg-white rounded-full" />
            <div className="absolute top-8 right-40 w-8 h-8 bg-white rounded-full" />
          </div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  title="Cambiar logo de la tienda"
                  className="relative w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden group shrink-0 disabled:opacity-70"
                >
                  {isCustomImage(store?.logo_url) ? (
                    <img src={getFileUrl(store.logo_url)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={22} className="text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingLogo ? (
                      <Loader2 size={16} className="text-white animate-spin" />
                    ) : (
                      <Camera size={16} className="text-white" />
                    )}
                  </div>
                </button>
                <div>
                  <h1 className="text-2xl font-bold">{store?.business_name}</h1>
                  <p className="text-white/60 text-sm">/{store?.slug}</p>
                </div>
              </div>
              {profileForm.tagline && (
                <p className="text-white/80 text-sm mt-2 max-w-md">{profileForm.tagline}</p>
              )}
            </div>
            <div className="text-right">
              <span className={"px-3 py-1.5 rounded-full text-xs font-medium " + (store?.status === "ACTIVE" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
                {store?.status === "ACTIVE" ? "Tienda activa" : "Tienda suspendida"}
              </span>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="space-y-4">
            {/* Info básica */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <Building2 size={16} className="text-[#86868B]" />
                <h2 className="font-semibold text-[#1D1D1F]">Información básica</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nombre comercial</label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                    <input type="text" value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      className={inputClass + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Correo de contacto</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                    <input type="email" value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className={inputClass + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                    <input type="tel" value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className={inputClass + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                    <input type="text" value={form.contact_address}
                      onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                      className={inputClass + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Descripción</label>
                  <textarea value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} className={inputClass + " resize-none"} />
                </div>
              </div>
            </motion.div>

            {/* Redes sociales */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <Globe size={16} className="text-[#86868B]" />
                <h2 className="font-semibold text-[#1D1D1F]">Redes sociales</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Facebook", key: "social_facebook", icon: FaFacebook },
                  { label: "Instagram", key: "social_instagram", icon: FaInstagram },
                  { label: "Sitio web", key: "social_website", icon: Globe },
                ].map(({ label, key, icon: Icon }) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                      <input
                        type="text"
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            {/* Perfil extendido */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <Zap size={16} className="text-[#86868B]" />
                <h2 className="font-semibold text-[#1D1D1F]">Perfil de tienda</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Eslogan</label>
                  <input type="text" value={profileForm.tagline}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    placeholder="La mejor tecnología al alcance de tu mano"
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Acerca de la tienda</label>
                  <textarea value={profileForm.about}
                    onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                    rows={6} placeholder="Cuéntale a tus clientes sobre tu tienda..."
                    className={inputClass + " resize-none"} />
                </div>
              </div>
            </motion.div>

            {/* Fiscal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <FileText size={16} className="text-[#86868B]" />
                <h2 className="font-semibold text-[#1D1D1F]">Información fiscal</h2>
              </div>
              <div>
                <label className={labelClass}>RTN / ID Fiscal</label>
                <input type="text" value={profileForm.tax_id}
                  onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value })}
                  placeholder="RTN-0000-0000-0000" className={inputClass + " font-mono"} />
                <p className="text-xs text-[#86868B] mt-1.5">
                  Este número se usará en la generación de facturas PDF.
                </p>
              </div>
            </motion.div>

            {/* Botón guardar */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={saving}
              className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-2xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? "Guardando..." : "Guardar todos los cambios"}
            </motion.button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}