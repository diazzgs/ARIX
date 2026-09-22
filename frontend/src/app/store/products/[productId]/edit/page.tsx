"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

export default function EditProductPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    sku: "",
    status: "ACTIVE",
  });
  const [stock, setStock] = useState({ stock_quantity: 0, min_stock: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

 useEffect(() => {
  Promise.all([
    api.get("/store/products?size=100"),
    api.get("/store/products/" + productId + "/inventory"),
    api.get("/categories?flat=true"),
  ])
    .then(([productsRes, invRes, catRes]) => {
      const products = productsRes.data.data.content;
      const p = products.find((prod: { id: number }) => prod.id === Number(productId));
      if (!p) throw new Error("Producto no encontrado");

      const inv = invRes.data.data;
      if (inv) {
        setStock({
          stock_quantity: inv.stock_quantity,
          min_stock: inv.min_stock,
        });
      }
      setForm({
        category_id: String(p.category?.id || ""),
        name: p.name || "",
        slug: p.slug || "",
        description: p.description || "",
        price: String(p.price || ""),
        sku: p.sku || "",
        status: p.status || "ACTIVE",
      });
      setCategories(catRes.data.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name"
        ? {
            slug: value
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          }
        : {}),
    }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setSaving(true);
  try {
    const requests: Promise<unknown>[] = [
      api.put("/store/products/" + productId, {
        category_id: Number(form.category_id),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        sku: form.sku,
      }),
      api.put("/store/products/" + String(productId) + "/inventory", {
        stock_quantity: Number(stock.stock_quantity),
        min_stock: Number(stock.min_stock),
      }),
    ];

    if (form.status) {
      requests.push(
        api.put("/store/products/" + productId + "/status", {
          status: form.status,
        })
      );
    }

    await Promise.all(requests);
    setSuccess("Producto actualizado correctamente");
    setTimeout(() => router.push("/store/products"), 1500);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    setError(e?.response?.data?.message || "Error al guardar los cambios");
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await api.delete("/store/products/" + productId);
      router.push("/store/products");
    } catch {
      setError("Error al eliminar el producto");
    }
  };

  if (loading) return <p className="text-[#86868B]">Cargando producto...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/store/products"
          className="text-[#86868B] hover:text-[#1D1D1F] text-sm"
        >
          ← Productos
        </Link>
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Eliminar producto
        </button>
      </div>

      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Editar producto</h1>

      {success && (
        <p className="text-green-600 text-sm mb-4 bg-green-50 px-4 py-3 rounded-xl">
          {success}
        </p>
      )}
      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información básica */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Información básica</h2>

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
              Categoría
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {[
            { label: "Nombre del producto", name: "name", type: "text", required: true },
            { label: "SKU", name: "sku", type: "text", required: false },
            { label: "Precio (L.)", name: "price", type: "number", required: true },
          ].map(({ label, name, type, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
                {label}
              </label>
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
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
              Estado
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="ACTIVE">Activo</option>
              <option value="DISABLED">Desactivado</option>
            </select>
          </div>
        </div>

        {/* Inventario */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Inventario</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
                Stock actual
              </label>
              <input
                type="number"
                min="0"
                value={stock.stock_quantity}
                onChange={(e) =>
                  setStock({ ...stock, stock_quantity: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                min="0"
                value={stock.min_stock}
                onChange={(e) =>
                  setStock({ ...stock, min_stock: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
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