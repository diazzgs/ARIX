"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface Product {
  id: number;
  name: string;
  price: number;
  primary_image_url: string | null;
  rating_avg: number;
  rating_count: number;
  store: { business_name: string };
  category: { name: string };
}

interface Category {
  id: number;
  name: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = (s = search, c = categoryId) => {
    setLoading(true);
    const params = new URLSearchParams({ size: "20" });
    if (s) params.append("search", s);
    if (c) params.append("category_id", c);
    api.get("/products?" + params.toString())
      .then((res) => setProducts(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/categories?flat=true")
      .then((res) => setCategories(res.data.data))
      .catch(console.error);
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2">Catálogo</h1>
          <p className="text-[#86868B] mb-6">Explora todos los productos disponibles en ARIX</p>
        </motion.div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
            >
              Buscar
            </button>
          </form>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); fetchProducts(search, e.target.value); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black text-[#1D1D1F]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-[#86868B]">Cargando productos...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#86868B]">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={"/catalog/" + product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
                >
                  <div className="h-40 bg-[#F5F5F7] flex items-center justify-center">
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#86868B] mb-1">{product.store.business_name}</p>
                    <p className="text-sm font-medium text-[#1D1D1F] line-clamp-2">{product.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-bold text-[#1D1D1F]">
                        {"L. " + Number(product.price).toLocaleString("es-HN")}
                      </p>
                      {product.rating_count > 0 && (
                        <p className="text-xs text-[#86868B]">
                          {"★ " + Number(product.rating_avg).toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}