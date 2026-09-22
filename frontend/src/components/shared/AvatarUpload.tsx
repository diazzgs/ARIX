"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import api, { getFileUrl } from "@/lib/api";

interface Props {
  imageUrl: string | null | undefined;
  initials: string;
  size?: number;
  onUploaded: (imageUrl: string) => void;
}

/** Indica si la URL corresponde a una imagen real subida por el usuario
 * (servida desde /api/files/...) en vez de un placeholder por defecto
 * (/images/...) que no existe físicamente en el servidor. */
const isCustomImage = (url: string | null | undefined): url is string =>
  !!url && url.startsWith("/api/files/");

export default function AvatarUpload({ imageUrl, initials, size = 64, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data.data.profile_image_url);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al subir la foto");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Cambiar foto de perfil"
        className="w-full h-full rounded-2xl bg-[#1D1D1F] flex items-center justify-center overflow-hidden relative group disabled:opacity-70"
      >
        {isCustomImage(imageUrl) ? (
          <img src={getFileUrl(imageUrl)} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold" style={{ fontSize: size * 0.32 }}>
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 size={size * 0.3} className="text-white animate-spin" />
          ) : (
            <Camera size={size * 0.3} className="text-white" />
          )}
        </div>
      </button>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">{error}</p>
      )}
    </div>
  );
}