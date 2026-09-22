"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showFilters, setShowFilters] = useState(false);

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

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    fetchProducts("", "");
  };

  const hasFilters = search || categoryId;

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1D1D1F]">Catálogo</h1>
          <p className="text-[#86868B] mt-1">
            {loading ? "Cargando..." : products.length + " productos disponibles"}
          </p>
        </motion.div>

        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos, marcas..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); fetchProducts("", categoryId); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-[#1D1D1F] text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={"p-3 rounded-2xl border text-sm transition-colors shadow-sm " + (showFilters || categoryId ? "bg-[#1D1D1F] text-white border-[#1D1D1F]" : "bg-white text-[#86868B] border-gray-200 hover:bg-gray-50")}
            >
              <SlidersHorizontal size={18} />
            </button>
          </form>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-widest mb-3">
                    Categorías
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setCategoryId(""); fetchProducts(search, ""); }}
                      className={"px-3 py-1.5 rounded-xl text-sm font-medium transition-colors " + (!categoryId ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-gray-200")}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryId(String(cat.id)); fetchProducts(search, String(cat.id)); }}
                        className={"px-3 py-1.5 rounded-xl text-sm font-medium transition-colors " + (categoryId === String(cat.id) ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-gray-200")}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtros activos */}
          <AnimatePresence>
            {hasFilters && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 mt-3"
              >
                <p className="text-xs text-[#86868B]">Filtros activos:</p>
                {search && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#1D1D1F] text-white rounded-full text-xs">
                    "{search}"
                    <button onClick={() => { setSearch(""); fetchProducts("", categoryId); }}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                {categoryId && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#1D1D1F] text-white rounded-full text-xs">
                    {categories.find((c) => String(c.id) === categoryId)?.name}
                    <button onClick={() => { setCategoryId(""); fetchProducts(search, ""); }}>
                      <X size={10} />
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-[#86868B] hover:text-red-500 underline">
                  Limpiar todo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="bg-white rounded-2xl h-64 shadow-sm"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium text-[#1D1D1F]">No se encontraron productos</p>
            <p className="text-[#86868B] mt-1 text-sm">Intenta con otros términos de búsqueda</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[#1D1D1F] underline font-medium"
            >
              Limpiar filtros
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={"/catalog/" + product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow block group"
                >
                  {/* Imagen */}
                  <div className="relative h-44 bg-[#F5F5F7] overflow-hidden">
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="text-5xl"
                        >
                          📦
                        </motion.div>
                      </div>
                    )}
                    {/* Badge categoría */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-[#1D1D1F] text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                        {product.category.name}
                      </span>
                    </div>
                    {/* Rating */}
                    {product.rating_count > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[#1D1D1F] text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                          ★ {Number(product.rating_avg).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs text-[#86868B] mb-1">{product.store.business_name}</p>
                    <p className="text-sm font-medium text-[#1D1D1F] line-clamp-2 leading-snug group-hover:text-black transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-base font-bold text-[#1D1D1F]">
                        {"L. " + Number(product.price).toLocaleString("es-HN")}
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-8 h-8 bg-[#1D1D1F] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-xs">→</span>
                      </motion.div>
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