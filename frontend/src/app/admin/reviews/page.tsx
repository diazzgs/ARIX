"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Review {
  id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  status: string;
  customer: { full_name: string };
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    api.get("/admin/reviews/reported?size=50")
      .then((res) => setReviews(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  const moderate = async (id: number, status: string) => {
    await api.put("/admin/reviews/" + id + "/moderate", { status });
    fetchReviews();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Reseñas reportadas</h1>
        <p className="text-[#86868B] mt-1">Modera las reseñas reportadas por usuarios</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando...</p>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No hay reseñas reportadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#1D1D1F]">{review.customer.full_name}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={s <= review.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                      ))}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      REPORTED
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#86868B]">{review.comment}</p>
                  )}
                  <p className="text-xs text-[#86868B] mt-1">
                    Producto #{review.product_id} · {new Date(review.created_at).toLocaleDateString("es-HN")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => moderate(review.id, "VISIBLE")}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => moderate(review.id, "HIDDEN")}
                    className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}