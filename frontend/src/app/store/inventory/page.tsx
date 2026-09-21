"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "@/lib/api";

interface InventoryItem {
  product_id: number;
  stock_quantity: number;
  min_stock: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string | null;
}

export default function StoreInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<number, InventoryItem>>({});
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ stock_quantity: 0, min_stock: 5 });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [productsRes, lowStockRes] = await Promise.all([
        api.get("/store/products?size=50"),
        api.get("/store/inventory/low-stock"),
      ]);
      const prods = productsRes.data.data.content as Product[];
      setProducts(prods);
      setLowStock(lowStockRes.data.data);

      const invMap: Record<number, InventoryItem> = {};
      await Promise.all(
        prods.map(async (p) => {
          const res = await api.get("/store/products/" + p.id + "/inventory");
          invMap[p.id] = res.data.data;
        })
      );
      setInventory(invMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Inventario</h1>
        <p className="text-[#86868B] mt-1">Controla el stock de tus productos</p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{lowStock.length} producto(s)</strong> con stock bajo o agotado
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-[#86868B]">Cargando inventario...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Producto</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Stock actual</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Stock mínimo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const inv = inventory[product.id];
                const isEditing = editing === product.id;
                return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1D1D1F]">{product.name}</p>
                      {product.sku && <p className="text-xs font-mono text-[#86868B]">{product.sku}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.stock_quantity}
                          onChange={(e) => setEditForm({ ...editForm, stock_quantity: Number(e.target.value) })}
                          className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      ) : (
                        <p className={"text-sm font-medium " + (inv?.is_out_of_stock ? "text-red-600" : inv?.is_low_stock ? "text-yellow-600" : "text-[#1D1D1F]")}>
                          {inv?.stock_quantity ?? "—"} uds
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.min_stock}
                          onChange={(e) => setEditForm({ ...editForm, min_stock: Number(e.target.value) })}
                          className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      ) : (
                        <p className="text-sm text-[#86868B]">{inv?.min_stock ?? "—"} uds</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + (inv?.is_out_of_stock ? "bg-red-100 text-red-700" : inv?.is_low_stock ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700")}>
                        {inv?.is_out_of_stock ? "Agotado" : inv?.is_low_stock ? "Stock bajo" : "Normal"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(product.id)}
                            disabled={saving}
                            className="text-xs bg-[#1D1D1F] text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                          >
                            {saving ? "..." : "Guardar"}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-[#86868B] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product.id)}
                          className="text-sm text-[#1D1D1F] font-medium hover:underline"
                        >
                          Editar stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}