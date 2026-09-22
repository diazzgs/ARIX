"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api, { getFileUrl } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import Toast from "@/components/shared/Toast";
import PageTransition from "@/components/shared/PageTransition";

interface Favorite {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    primary_image_url: string | null;
    store: { id: number; business_name: string; slug: string };
    inventory: { stock_quantity: number; is_out_of_stock: boolean } | null;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const { addItem } = useCartStore();

  const fetchFavorites = () => {
    api.get("/favorites?size=50")
      .then((res) => setFavorites(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFavorites(); }, []);

  const remove = async (productId: number) => {
    setRemovingId(productId);
    try {
      await api.delete("/favorites/" + productId);
      fetchFavorites();
      setToast({ visible: true, message: "Eliminado de favoritos" });
    } finally {
      setRemovingId(null);
    }
  };

  const addToCart = (fav: Favorite) => {
    addItem({
      product_id: fav.product.id,
      name: fav.product.name,
      price: Number(fav.product.price),
      store_id: fav.product.store.id,
      store_name: fav.product.store.business_name,
      image_url: fav.product.primary_image_url,
    });
    setToast({ visible: true, message: `"${fav.product.name}" agregado al carrito` });
  };

  return (
    <PageTransition>
      <div>
        <Toast
          message={toast.message}
          visible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Favoritos</h1>
            <p className="text-[#86868B] mt-1">
              {loading ? "Cargando..." : favorites.length === 0 ? "No tienes favoritos aún" : favorites.length + " producto" + (favorites.length !== 1 ? "s" : "") + " guardado" + (favorites.length !== 1 ? "s" : "")}
            </p>
          </div>
          {favorites.length > 0 && (
            <Link
              href="/catalog"
              className="flex items-center gap-2 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              Ver catálogo
              <ArrowRight size={14} />
            </Link>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="bg-white rounded-2xl h-72 shadow-sm"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-16 text-center shadow-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart size={40} className="text-gray-200 mx-auto mb-4" />
            </motion.div>
            <p className="text-lg font-medium text-[#1D1D1F]">Sin favoritos aún</p>
            <p className="text-sm text-[#86868B] mt-1">
              Guarda productos que te interesen para comprarlos después
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 bg-[#1D1D1F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors"
            >
              Explorar catálogo
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Imagen */}
                  <Link href={"/catalog/" + fav.product.id} className="block">
                    <div className="relative h-44 bg-[#F5F5F7] overflow-hidden">
                      {fav.product.primary_image_url ? (
                        <img
                          src={getFileUrl(fav.product.primary_image_url)}
                          alt={fav.product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Heart size={32} className="text-gray-300" />
                        </div>
                      )}
                      {/* Badge stock */}
                      {fav.product.inventory?.is_out_of_stock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-red-100">
                            Agotado
                          </span>
                        </div>
                      )}
                      {/* Corazón */}
                      <div className="absolute top-3 right-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Heart size={14} className="text-red-500 fill-red-500" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs text-[#86868B] mb-1">{fav.product.store.business_name}</p>
                    <Link href={"/catalog/" + fav.product.id}>
                      <p className="text-sm font-semibold text-[#1D1D1F] line-clamp-2 hover:underline">
                        {fav.product.name}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-base font-bold text-[#1D1D1F]">
                        {"L. " + Number(fav.product.price).toLocaleString("es-HN")}
                      </p>
                      <div className="flex items-center gap-2">
                        {!fav.product.inventory?.is_out_of_stock && (
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(fav)}
                            title="Agregar al carrito"
                            className="w-8 h-8 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <ShoppingCart size={14} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => remove(fav.product.id)}
                          disabled={removingId === fav.product.id}
                          title="Eliminar de favoritos"
                          className="w-8 h-8 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}