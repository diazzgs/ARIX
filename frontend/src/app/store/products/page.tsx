"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import api from "@/lib/api";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  status: string;
  sku: string | null;
  inventory: { stock_quantity: number; is_low_stock: boolean } | null;
}

const statusColor = (s: string) => {
  if (s === "ACTIVE") return "bg-green-100 text-green-700";
  if (s === "DISABLED") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/store/products?size=50")
      .then((res) => setProducts(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Productos</h1>
          <p className="text-[#86868B] mt-1">Gestiona el catálogo de tu tienda</p>
        </div>
        <Link
          href="/store/products/new"
          className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando productos...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Producto</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">SKU</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Precio</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Stock</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#F5F5F7] rounded-xl flex items-center justify-center">
                        <Package size={16} className="text-[#86868B]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1D1D1F]">{product.name}</p>
                        <p className="text-xs text-[#86868B]">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-[#86868B]">{product.sku || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">L. {Number(product.price).toLocaleString("es-HN")}</p>
                  </td>
                  <td className="px-6 py-4">
                    {product.inventory ? (
                      <span className={`text-sm font-medium ${product.inventory.is_low_stock ? "text-red-600" : "text-[#1D1D1F]"}`}>
                        {product.inventory.stock_quantity} uds
                        {product.inventory.is_low_stock && " ⚠️"}
                      </span>
                    ) : (
                      <span className="text-sm text-[#86868B]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/store/products/${product.id}/edit`}
                      className="text-sm text-[#1D1D1F] font-medium hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}