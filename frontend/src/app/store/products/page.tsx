"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Package, AlertTriangle, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  status: string;
  sku: string | null;
  inventory: { stock_quantity: number; is_low_stock: boolean; is_out_of_stock: boolean } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Activo", color: "bg-green-100 text-green-700" },
  DISABLED: { label: "Desactivado", color: "bg-red-100 text-red-700" },
  DRAFT: { label: "Borrador", color: "bg-gray-100 text-gray-600" },
};

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/store/products?size=50")
      .then((res) => {
        setProducts(res.data.data.content);
        setFiltered(res.data.data.content);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q)
    ));
  }, [search, products]);

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const lowStockCount = products.filter((p) => p.inventory?.is_low_stock).length;
  const outOfStockCount = products.filter((p) => p.inventory?.is_out_of_stock).length;

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Productos</h1>
            <p className="text-[#86868B] mt-1">Gestiona el catálogo de tu tienda</p>
          </div>
          <Link
            href="/store/products/new"
            className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            Nuevo producto
          </Link>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Activos", value: activeCount, color: "text-green-600", bg: "bg-green-50" },
            { label: "Stock bajo", value: lowStockCount, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Agotados", value: outOfStockCount, color: "text-red-600", bg: "bg-red-50" },
          ].map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={"rounded-2xl p-4 " + bg}
            >
              <p className={"text-2xl font-bold " + color}>{value}</p>
              <p className="text-xs text-[#86868B] mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-4"
        >
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
          />
        </motion.div>

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
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#86868B]">No se encontraron productos</p>
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
                  {["Producto", "SKU", "Precio", "Stock", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((product, index) => {
                    const statusInfo = statusConfig[product.status] || statusConfig.DRAFT;
                    const inv = product.inventory;
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="border-b border-gray-50 hover:bg-[#F5F5F7] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#F5F5F7] group-hover:bg-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm">
                              <Package size={16} className="text-[#86868B]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1D1D1F]">{product.name}</p>
                              <p className="text-xs text-[#86868B]">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-mono text-[#86868B]">{product.sku || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#1D1D1F]">
                            {"L. " + Number(product.price).toLocaleString("es-HN")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {inv ? (
                            <div className="flex items-center gap-1.5">
                              <span className={"text-sm font-medium " + (inv.is_out_of_stock ? "text-red-600" : inv.is_low_stock ? "text-yellow-600" : "text-[#1D1D1F]")}>
                                {inv.stock_quantity} uds
                              </span>
                              {(inv.is_low_stock || inv.is_out_of_stock) && (
                                <AlertTriangle size={13} className={inv.is_out_of_stock ? "text-red-500" : "text-yellow-500"} />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-[#86868B]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + statusInfo.color}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={"/store/products/" + product.id + "/edit"}
                            className="text-sm font-medium text-[#1D1D1F] hover:underline"
                          >
                            Editar
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}