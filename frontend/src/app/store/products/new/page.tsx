"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    sku: "",
    initial_stock: "0",
    min_stock: "5",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/categories?flat=true")
      .then((res) => setCategories(res.data.data))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/store/products", {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        initial_stock: Number(form.initial_stock),
        min_stock: Number(form.min_stock),
      });
      router.push("/store/products");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/store/products" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-6 inline-block">
        ← Productos
      </Link>
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Nuevo producto</h1>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Información básica</h2>

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Categoría</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {[
            { label: "Nombre del producto", name: "name", type: "text", required: true },
            { label: "Slug (URL)", name: "slug", type: "text", required: true },
            { label: "SKU", name: "sku", type: "text", required: false },
            { label: "Precio (L.)", name: "price", type: "number", required: true },
          ].map(({ label, name, type, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                required={required}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Inventario inicial</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Stock inicial</label>
              <input
                type="number"
                name="initial_stock"
                value={form.initial_stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">Stock mínimo (alerta)</label>
              <input
                type="number"
                name="min_stock"
                value={form.min_stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {loading ? "Creando producto..." : "Crear producto"}
        </button>
      </form>
    </div>
  );
}