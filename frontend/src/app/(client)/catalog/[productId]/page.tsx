"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, ShoppingCart, Heart, MessageCircle, Package, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api, { getFileUrl } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import Toast from "@/components/shared/Toast";

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
  customer: { id: number; full_name: string };
  created_at: string;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [deletingReview, setDeletingReview] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated || !productId) return;
    api.get("/favorites?size=100")
      .then((res) => {
        const favs = res.data.data.content;
        const found = favs.some(
          (f: { product: { id: number } }) => f.product.id === Number(productId)
        );
        setIsFavorite(found);
      })
      .catch(console.error);
  }, [isAuthenticated, productId]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        store_id: product.store.id,
        store_name: product.store.business_name,
        image_url: product.images.find((img) => img.is_primary)?.image_url || null,
      });
    }
    setToast({ visible: true, message: `"${product.name}" agregado al carrito` });
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await api.delete("/favorites/" + productId);
        setIsFavorite(false);
        setToast({ visible: true, message: "Eliminado de favoritos" });
      } else {
        await api.post("/favorites", { product_id: Number(productId) });
        setIsFavorite(true);
        setToast({ visible: true, message: "Agregado a favoritos ❤️" });
      }
    } catch {
      setToast({ visible: true, message: "Error al actualizar favoritos" });
    } finally {
      setFavLoading(false);
    }
  };

  const startChat = async () => {
    if (!isAuthenticated || !product) return;
    setStartingChat(true);
    try {
      const storeRes = await api.get("/stores/" + product.store.slug);
      const adminId = storeRes.data.data.admin.id;
      await api.post("/chats", {
        other_user_id: adminId,
        store_id: product.store.id,
      });
      router.push("/chat");
    } catch {
      router.push("/chat");
    } finally {
      setStartingChat(false);
    }
  };

  const refreshReviews = async () => {
    const [prodRes, revRes] = await Promise.all([
      api.get("/products/" + productId),
      api.get("/products/" + productId + "/reviews"),
    ]);
    setProduct(prodRes.data.data);
    setReviews(revRes.data.data.content);
  };

  const openReviewForm = (existing?: Review) => {
    setReviewRating(existing?.rating || 5);
    setReviewComment(existing?.comment || "");
    setReviewError("");
    setShowReviewForm(true);
  };

  const submitReview = async (existing?: Review) => {
    setSubmittingReview(true);
    setReviewError("");
    try {
      if (existing) {
        await api.put("/reviews/" + existing.id, { rating: reviewRating, comment: reviewComment || null });
      } else {
        await api.post("/products/" + productId + "/reviews", { rating: reviewRating, comment: reviewComment || null });
      }
      await refreshReviews();
      setShowReviewForm(false);
      setToast({ visible: true, message: existing ? "✓ Reseña actualizada" : "✓ Reseña publicada correctamente" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setReviewError(e?.response?.data?.message || "No se pudo guardar la reseña");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    setDeletingReview(true);
    try {
      await api.delete("/reviews/" + reviewId);
      await refreshReviews();
      setToast({ visible: true, message: "Reseña eliminada" });
    } catch {
      setToast({ visible: true, message: "Error al eliminar la reseña" });
    } finally {
      setDeletingReview(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#86868B]">Cargando producto...</p>
    </div>
  );
  if (!product) return <p className="text-red-500">Producto no encontrado</p>;

  const isClient = isAuthenticated && user?.role.name === "ROLE_CLIENT";
  const myReview = user ? reviews.find((r) => r.customer.id === user.id) : undefined;
  const otherReviews = user ? reviews.filter((r) => r.customer.id !== user.id) : reviews;

  return (
    <div>
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Volver */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors mb-4 group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#86868B] mb-6">
        <Link href="/catalog" className="hover:text-[#1D1D1F] transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-[#86868B]">{product.category.name}</span>
        <span>/</span>
        <span className="text-[#1D1D1F] font-medium truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Galería de fotos */}
        <ProductGallery key={product.id} product={product} />

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5"
        >
          {/* Tienda y categoría */}
          <div className="flex items-center gap-2">
            <Link
              href={"/stores/" + product.store.slug}
              className="text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              {product.store.business_name}
            </Link>
            <span className="text-[#86868B]">·</span>
            <span className="text-sm text-[#86868B] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full">
              {product.category.name}
            </span>
          </div>

          {/* Nombre */}
          <h1 className="text-3xl font-bold text-[#1D1D1F] leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(product.rating_avg) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                  />
                ))}
              </div>
              <span className="text-sm text-[#86868B]">
                {Number(product.rating_avg).toFixed(1)} · {product.rating_count} reseña{product.rating_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Precio */}
          <div className="bg-[#F5F5F7] rounded-2xl p-4">
            <p className="text-4xl font-bold text-[#1D1D1F]">
              {"L. " + Number(product.price).toLocaleString("es-HN")}
            </p>
            <p className="text-xs text-[#86868B] mt-1">Precio incluye impuestos (15%)</p>
          </div>

          {/* Descripción */}
          {product.description && (
            <p className="text-sm text-[#86868B] leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={"w-2 h-2 rounded-full " + (product.inventory?.is_out_of_stock ? "bg-red-500" : "bg-green-500")} />
            <span className={"text-sm font-medium " + (product.inventory?.is_out_of_stock ? "text-red-500" : "text-green-600")}>
              {product.inventory?.is_out_of_stock
                ? "Agotado"
                : "En stock — " + product.inventory?.stock_quantity + " unidades disponibles"}
            </span>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-[#86868B]">SKU: <span className="font-mono">{product.sku}</span></p>
          )}

          {/* Cantidad */}
          {!product.inventory?.is_out_of_stock && isAuthenticated && user?.role.name === "ROLE_CLIENT" && (
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-[#1D1D1F]">Cantidad:</p>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-[#86868B] hover:bg-gray-50 transition-colors text-lg font-light"
                >−</button>
                <span className="px-5 py-2.5 text-sm font-medium border-x border-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, product.inventory?.stock_quantity || 99))}
                  className="px-4 py-2.5 text-[#86868B] hover:bg-gray-50 transition-colors text-lg font-light"
                >+</button>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-3 mt-auto">
            {isAuthenticated && user?.role.name === "ROLE_CLIENT" && !product.inventory?.is_out_of_stock && (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#1D1D1F] text-white py-3.5 rounded-2xl text-sm font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingCart size={16} />
                  Agregar al carrito
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={"p-3.5 rounded-2xl border-2 transition-colors disabled:opacity-50 " + (isFavorite ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-[#86868B] hover:border-gray-300 bg-white")}
                >
                  <Heart size={18} className={isFavorite ? "fill-red-500" : ""} />
                </motion.button>
              </div>
            )}

            {isAuthenticated && user?.role.name === "ROLE_CLIENT" && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={startChat}
                disabled={startingChat}
                className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-medium text-[#86868B] hover:bg-gray-50 hover:text-[#1D1D1F] hover:border-gray-300 transition-colors flex items-center justify-center gap-2 bg-white disabled:opacity-50"
              >
                <MessageCircle size={16} />
                {startingChat ? "Abriendo chat..." : "Preguntar al vendedor"}
              </motion.button>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-2xl text-sm font-medium text-center hover:bg-black transition-colors"
              >
                Inicia sesión para comprar
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reseñas */}
      {(reviews.length > 0 || isClient) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              Reseñas ({reviews.length})
            </h2>
            {isClient && !myReview && !showReviewForm && (
              <button
                onClick={() => openReviewForm()}
                className="flex items-center gap-1.5 text-sm font-medium text-[#1D1D1F] hover:opacity-70 transition-opacity"
              >
                <Star size={14} />
                Escribir una reseña
              </button>
            )}
          </div>

          {/* Formulario: nueva reseña o edición de la propia */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#F5F5F7] rounded-2xl p-5 mb-6">
                  <p className="text-sm font-medium text-[#1D1D1F] mb-2">Tu calificación</p>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)}>
                        <Star
                          size={24}
                          className={star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[#1D1D1F] mb-2">Comentario (opcional)</p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Cuéntanos qué te pareció el producto..."
                    className="w-full bg-white rounded-xl p-3 text-sm text-[#1D1D1F] border border-gray-200 focus:outline-none focus:border-[#1D1D1F] transition-colors resize-none"
                  />
                  {reviewError && (
                    <p className="text-xs text-red-500 mt-2">{reviewError}</p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => submitReview(myReview)}
                      disabled={submittingReview}
                      className="flex-1 bg-[#1D1D1F] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? "Guardando..." : myReview ? "Actualizar reseña" : "Publicar reseña"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tu reseña */}
          {myReview && !showReviewForm && (
            <div className="bg-[#F5F5F7] rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1D1D1F] rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0">
                    {myReview.customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1D1D1F]">Tu reseña</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={11}
                          className={star <= myReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openReviewForm(myReview)}
                    className="text-xs text-[#86868B] hover:text-[#1D1D1F] px-2 py-1 rounded-lg hover:bg-white transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteReview(myReview.id)}
                    disabled={deletingReview}
                    className="text-xs text-[#86868B] hover:text-red-500 px-2 py-1 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {deletingReview ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
              {myReview.comment && (
                <p className="text-sm text-[#86868B] mt-1 ml-11">{myReview.comment}</p>
              )}
            </div>
          )}

          {/* Reseñas de otros clientes */}
          {otherReviews.length > 0 ? (
            <div className="space-y-5">
              {otherReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="pb-5 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F5F5F7] rounded-full flex items-center justify-center text-sm font-medium text-[#1D1D1F]">
                        {review.customer.full_name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium text-[#1D1D1F]">{review.customer.full_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
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
                    <p className="text-sm text-[#86868B] ml-11 leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-300 ml-11 mt-1">
                    {new Date(review.created_at).toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            reviews.length === 0 && (
              <p className="text-sm text-[#86868B] text-center py-4">
                Todavía no hay reseñas para este producto{isClient ? ". ¡Sé el primero en dejar una!" : "."}
              </p>
            )
          )}
        </motion.div>
      )}
    </div>
  );
}

function ProductGallery({ product }: { product: Product }) {
  const images = product.images;
  const [activeImageIndex, setActiveImageIndex] = useState(() => {
    const primaryIdx = images.findIndex((i) => i.is_primary);
    return primaryIdx >= 0 ? primaryIdx : 0;
  });
  const activeImage = images[activeImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;
  const goToImage = (index: number) => setActiveImageIndex(index);
  const prevImage = () => setActiveImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImageIndex((i) => (i + 1) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3"
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden shadow-sm"
        style={{ minHeight: "400px" }}
      >
        {activeImage ? (
          <AnimatePresence>
            <motion.img
              key={activeImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              src={getFileUrl(activeImage.image_url)}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ minHeight: "400px" }}
            />
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: "400px" }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Package size={64} className="text-gray-300" />
            </motion.div>
            <p className="text-sm text-[#86868B] mt-3">Sin imagen disponible</p>
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1D1D1F] hover:bg-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImage}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1D1D1F] hover:bg-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => goToImage(i)}
                  aria-label={"Ver foto " + (i + 1)}
                  className={"h-1.5 rounded-full transition-all " + (i === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/60")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => goToImage(i)}
              className={"w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors " + (i === activeImageIndex ? "border-[#1D1D1F]" : "border-transparent hover:border-gray-200")}
            >
              <img src={getFileUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}