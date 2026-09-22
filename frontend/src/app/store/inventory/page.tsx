"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Warehouse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";
import Toast from "@/components/shared/Toast";

interface Product { id: number; name: string; sku: string | null; }
interface InventoryItem { stock_quantity: number; min_stock: number; is_low_stock: boolean; is_out_of_stock: boolean; }

export default function StoreInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<number, InventoryItem>>({});
  const [lowStock, setLowStock] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ stock_quantity: 0, min_stock: 5 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const fetchData = async () => {
    try {
      const [productsRes, lowStockRes] = await Promise.all([
        api.get("/store/products?size=50"),
        api.get("/store/inventory/low-stock"),
      ]);
      const prods = productsRes.data.data.content as Product[];
      setProducts(prods);
      setLowStock(lowStockRes.data.data.length);
      const invMap: Record<number, InventoryItem> = {};
      await Promise.all(prods.map(async (p) => {
        const res = await api.get("/store/products/" + p.id + "/inventory");
        invMap[p.id] = res.data.data;
      }));
      setInventory(invMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (productId: number) => {
    const inv = inventory[productId];
    setEditForm({ stock_quantity: inv?.stock_quantity || 0, min_stock: inv?.min_stock || 5 });
    setEditing(productId);
  };

  const saveEdit = async (productId: number) => {
    setSaving(true);
    try {
      await api.put("/store/products/" + productId + "/inventory", editForm);
      setEditing(null);
      setToast({ visible: true, message: "✓ Inventario actualizado correctamente" });
      fetchData();
    } catch { setToast({ visible: true, message: "Error al actualizar el inventario" }); }
    finally { setSaving(false); }
  };

  const totalStock = Object.values(inventory).reduce((acc, inv) => acc + (inv?.stock_quantity || 0), 0);

  return (
    <PageTransition>
      <div>
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Inventario</h1>
          <p className="text-[#86868B] mt-1">Controla el stock de tus productos</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Unidades totales", value: totalStock, color: "text-[#1D1D1F]", bg: "bg-white" },
            { label: "Con stock bajo", value: lowStock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Productos", value: products.length, color: "text-[#1D1D1F]", bg: "bg-[#F5F5F7]" },
          ].map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={"rounded-2xl p-5 shadow-sm " + bg}
            >
              <p className={"text-2xl font-bold " + color}>{value}</p>
              <p className="text-xs text-[#86868B] mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Alerta stock bajo */}
        <AnimatePresence>
          {lowStock > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 mb-5 flex items-center gap-3"
            >
              <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">
                <strong>{lowStock} producto(s)</strong> con stock bajo o agotado — actualiza tu inventario
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="bg-white rounded-2xl h-16 shadow-sm"
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F9F9F9]">
                  {["Producto", "Stock actual", "Mínimo", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const inv = inventory[product.id];
                  const isEditing = editing === product.id;
                  const stockStatus = inv?.is_out_of_stock ? "Agotado" : inv?.is_low_stock ? "Stock bajo" : "Normal";
                  const stockColor = inv?.is_out_of_stock ? "bg-red-100 text-red-700" : inv?.is_low_stock ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={"border-b border-gray-50 transition-colors " + (isEditing ? "bg-[#F5F5F7]" : "hover:bg-[#F9F9F9]")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#F5F5F7] rounded-xl flex items-center justify-center shrink-0">
                            <Warehouse size={14} className="text-[#86868B]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1D1D1F]">{product.name}</p>
                            {product.sku && <p className="text-xs font-mono text-[#86868B]">{product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editForm.stock_quantity}
                            onChange={(e) => setEditForm({ ...editForm, stock_quantity: Number(e.target.value) })}
                            className="w-24 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        ) : (
                          <p className={"text-sm font-bold " + (inv?.is_out_of_stock ? "text-red-600" : inv?.is_low_stock ? "text-yellow-600" : "text-[#1D1D1F]")}>
                            {inv?.stock_quantity ?? "—"} uds
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editForm.min_stock}
                            onChange={(e) => setEditForm({ ...editForm, min_stock: Number(e.target.value) })}
                            className="w-24 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        ) : (
                          <p className="text-sm text-[#86868B]">{inv?.min_stock ?? "—"} uds</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + stockColor}>
                          {stockStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => saveEdit(product.id)}
                              disabled={saving}
                              className="text-xs bg-[#1D1D1F] text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                            >
                              {saving ? "..." : "Guardar"}
                            </motion.button>
                            <button
                              onClick={() => setEditing(null)}
                              className="text-xs text-[#86868B] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(product.id)}
                            className="text-sm font-medium text-[#1D1D1F] hover:underline"
                          >
                            Editar stock
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}