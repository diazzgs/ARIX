"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  status: string;
  rating_avg: number;
  rating_count: number;
  sales_count: number;
  store: { id: number; business_name: string; slug: string };
  category: { name: string };
  images: { id: number; image_url: string; is_primary: boolean }[];
  inventory: { stock_quantity: number; is_out_of_stock: boolean } | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  customer: { full_name: string };
  created_at: string;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedFav, setAddedFav] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get("/products/" + productId),
      api.get("/products/" + productId + "/reviews"),
    ])
      .then(([prodRes, revRes]) => {
        setProduct(prodRes.data.data);
        setReviews(revRes.data.data.content);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  const addToFavorites = async () => {
    if (!isAuthenticated) return;
    await api.post("/favorites", { product_id: Number(productId) });
    setAddedFav(true);
  };

  if (loading) return <p className="p-8 text-[#86868B]">Cargando producto...</p>;
  if (!product) return <p className="p-8 text-red-500">Producto no encontrado</p>;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-[#86868B]">
          <Link href="/catalog" className="hover:text-[#1D1D1F]">Catálogo</Link>
          <span>/</span>
          <span className="text-[#1D1D1F]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Imagen */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-80 flex items-center justify-center">
            {product.images.length > 0 ? (
              <img
                src={product.images.find((i) => i.is_primary)?.image_url || product.images[0].image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-6xl">📦</div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Link
              href={"/stores/" + product.store.slug}
              className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              {product.store.business_name}
            </Link>
            <h1 className="text-2xl font-bold text-[#1D1D1F] mt-1 mb-2">{product.name}</h1>

            {product.rating_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.round(product.rating_avg) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#86868B]">
                  {Number(product.rating_avg).toFixed(1)} ({product.rating_count} reseñas)
                </span>
              </div>
            )}

            <p className="text-3xl font-bold text-[#1D1D1F] mb-4">
              {"L. " + Number(product.price).toLocaleString("es-HN")}
            </p>

            {product.description && (
              <p className="text-sm text-[#86868B] mb-6 leading-relaxed">{product.description}</p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className={"text-sm font-medium " + (product.inventory?.is_out_of_stock ? "text-red-500" : "text-green-600")}>
                {product.inventory?.is_out_of_stock ? "Agotado" : "En stock (" + product.inventory?.stock_quantity + " uds)"}
              </span>
            </div>

            {!product.inventory?.is_out_of_stock && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-[#86868B] hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-[#86868B] hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {isAuthenticated && user?.role.name === "ROLE_CLIENT" && (
                <>
                  <Link
                    href="/checkout"
                    className="flex-1 bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium text-center hover:bg-black transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Comprar ahora
                  </Link>
                  <button
                    onClick={addToFavorites}
                    disabled={addedFav}
                    className={"p-3 rounded-xl border transition-colors " + (addedFav ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-[#86868B] hover:border-gray-300")}
                  >
                    <Heart size={18} className={addedFav ? "fill-red-500" : ""} />
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="flex-1 bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium text-center hover:bg-black transition-colors"
                >
                  Inicia sesión para comprar
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[#1D1D1F] mb-4">Reseñas ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#1D1D1F]">{review.customer.full_name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#86868B]">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}