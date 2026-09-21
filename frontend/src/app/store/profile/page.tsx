"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StoreData {
  id: number;
  business_name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  status: string;
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
  const [success, setSuccess] = useState("");

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    try {
      await Promise.all([
        api.put("/store/me", form),
        api.put("/store/me/profile", profileForm),
      ]);
      setSuccess("Tienda actualizada correctamente");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[#86868B]">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Mi Tienda</h1>

      {success && (
        <p className="text-green-600 text-sm mb-4 bg-green-50 px-4 py-3 rounded-xl">{success}</p>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Información básica</h2>
          {[
            { label: "Nombre comercial", key: "business_name" },
            { label: "Correo de contacto", key: "contact_email" },
            { label: "Teléfono", key: "contact_phone" },
            { label: "Dirección", key: "contact_address" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Perfil extendido</h2>
          {[
            { label: "Eslogan", key: "tagline" },
            { label: "Facebook", key: "social_facebook" },
            { label: "Instagram", key: "social_instagram" },
            { label: "Sitio web", key: "social_website" },
            { label: "RTN / ID Fiscal", key: "tax_id" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">{label}</label>
              <input
                type="text"
                value={profileForm[key as keyof typeof profileForm]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Acerca de</label>
            <textarea
              value={profileForm.about}
              onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}