"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Package, Tag, DollarSign, FileText, ToggleLeft, Warehouse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import Toast from "@/components/shared/Toast";

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
    description: "",
    price: "",
    sku: "",
    status: "ACTIVE",
  });
  const [stock, setStock] = useState({ stock_quantity: 0, min_stock: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    Promise.all([
      api.get("/store/products?size=100"),
      api.get("/store/products/" + productId + "/inventory"),
      api.get("/categories?flat=true"),
    ])
      .then(([productsRes, invRes, catRes]) => {
        const prods = productsRes.data.data.content;
        const p = prods.find((prod: { id: number }) => prod.id === Number(productId));
        if (p) {
          setForm({
            category_id: String(p.category?.id || ""),
            name: p.name || "",
            description: p.description || "",
            price: String(p.price || ""),
            sku: p.sku || "",
            status: p.status || "ACTIVE",
          });
        }
        const inv = invRes.data.data;
        if (inv) setStock({ stock_quantity: inv.stock_quantity, min_stock: inv.min_stock });
        setCategories(catRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.put("/store/products/" + productId, {
          category_id: Number(form.category_id),
          name: form.name,
          description: form.description,
          price: Number(form.price),
          sku: form.sku,
        }),
        api.put("/store/products/" + productId + "/inventory", {
          stock_quantity: Number(stock.stock_quantity),
          min_stock: Number(stock.min_stock),
        }),
        api.put("/store/products/" + productId + "/status", { status: form.status }),
      ]);
      setToast({ visible: true, message: "✓ Producto actualizado correctamente" });
      setTimeout(() => router.push("/store/products"), 1500);
    } catch {
      setToast({ visible: true, message: "Error al guardar los cambios" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete("/store/products/" + productId);
      router.push("/store/products");
    } catch {
      setToast({ visible: true, message: "Error al eliminar el producto" });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="bg-white rounded-2xl h-32 shadow-sm"
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Modal confirmar eliminar */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-[#1D1D1F] text-center mb-2">¿Eliminar producto?</h2>
              <p className="text-sm text-[#86868B] text-center mb-6">
                Esta acción no se puede deshacer. El producto será eliminado permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link
          href="/store/products"
          className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Productos
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
        >
          <Trash2 size={15} />
          Eliminar producto
        </button>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-2xl font-bold text-[#1D1D1F] mb-6"
      >
        Editar producto
      </motion.h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información básica */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Package size={16} className="text-[#86868B]" />
            <h2 className="font-semibold text-[#1D1D1F]">Información básica</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Categoría
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Nombre del producto
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                  Precio (L.)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Descripción
              </label>
              <div className="relative">
                <FileText size={14} className="absolute left-3.5 top-3.5 text-[#86868B]" />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inventario */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Warehouse size={16} className="text-[#86868B]" />
            <h2 className="font-semibold text-[#1D1D1F]">Inventario</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Stock actual
              </label>
              <input
                type="number"
                min="0"
                value={stock.stock_quantity}
                onChange={(e) => setStock({ ...stock, stock_quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Stock mínimo
              </label>
              <input
                type="number"
                min="0"
                value={stock.min_stock}
                onChange={(e) => setStock({ ...stock, min_stock: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <p className="text-xs text-[#86868B] mt-2">
            Se enviará una alerta cuando el stock baje del mínimo configurado.
          </p>
        </motion.div>

        {/* Estado */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <ToggleLeft size={16} className="text-[#86868B]" />
            <h2 className="font-semibold text-[#1D1D1F]">Estado del producto</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "ACTIVE", label: "Activo", desc: "Visible en el catálogo", color: "border-green-500 bg-green-50" },
              { value: "DISABLED", label: "Desactivado", desc: "Oculto del catálogo", color: "border-red-400 bg-red-50" },
            ].map(({ value, label, desc, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, status: value })}
                className={"p-4 rounded-xl border-2 text-left transition-all " + (form.status === value ? color : "border-gray-200 hover:border-gray-300")}
              >
                <p className="text-sm font-semibold text-[#1D1D1F]">{label}</p>
                <p className="text-xs text-[#86868B] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={saving}
          className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-2xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? "Guardando cambios..." : "Guardar cambios"}
        </motion.button>
      </form>
    </div>
  );
}