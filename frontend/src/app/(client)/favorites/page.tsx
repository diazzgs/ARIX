"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import api from "@/lib/api";

interface Favorite {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    primary_image_url: string | null;
    store: { business_name: string };
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    api.get("/favorites?size=50")
      .then((res) => setFavorites(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFavorites(); }, []);

  const remove = async (productId: number) => {
    await api.delete("/favorites/" + productId);
    fetchFavorites();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Favoritos</h1>
        <p className="text-[#86868B] mt-1">Productos que guardaste para después</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando favoritos...</p>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Heart size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[#86868B]">No tienes favoritos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="w-full h-32 bg-[#F5F5F7] rounded-xl mb-4 flex items-center justify-center">
                {fav.product.primary_image_url ? (
                  <img src={fav.product.primary_image_url} alt={fav.product.name} className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <Heart size={24} className="text-gray-300" />
                )}
              </div>
              <p className="text-sm font-medium text-[#1D1D1F]">{fav.product.name}</p>
              <p className="text-xs text-[#86868B] mt-0.5">{fav.product.store.business_name}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-bold text-[#1D1D1F]">
                  {"L. " + Number(fav.product.price).toLocaleString("es-HN")}
                </p>
                <button
                  onClick={() => remove(fav.product.id)}
                  className="text-[#86868B] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}