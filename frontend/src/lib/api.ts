import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Convierte una URL relativa de archivo devuelta por el backend
 * (ej. "/api/files/avatars/xxx.png") en una URL absoluta hacia el
 * servidor de la API.
 *
 * Las imágenes subidas (avatar, logo de tienda, fotos de producto) se
 * sirven desde el backend (ej. localhost:8080), no desde el frontend
 * (ej. localhost:3000). Un <img src="/api/files/..."> sin este prefijo
 * se resuelve contra el origen del frontend y nunca carga la imagen.
 */
export const getFileUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/files/")) {
    return API_BASE_URL.replace(/\/api\/?$/, "") + url;
  }
  return url;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ... el resto del archivo (interceptores, export default api) queda igual, no lo toqué

// Interceptor: agrega el token JWT a cada petición automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: si el token expiró (401), limpia la sesión y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
