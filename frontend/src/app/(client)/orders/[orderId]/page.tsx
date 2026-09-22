"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Star, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import Toast from "@/components/shared/Toast";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface StoreOrder {
  id: number;
  sub_order_number: string;
  store: { business_name: string };
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  items: OrderItem[];
}

interface OrderDetail {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  store_orders: StoreOrder[];
  payment: { status: string; card_last_digits: string | null } | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  type: string;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "text-yellow-700", bg: "bg-yellow-50" },
  CONFIRMED: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50" },
  PREPARING: { label: "Preparando", color: "text-purple-700", bg: "bg-purple-50" },
  SHIPPED: { label: "Enviado", color: "text-indigo-700", bg: "bg-indigo-50" },
  DELIVERED: { label: "Entregado ✓", color: "text-green-700", bg: "bg-green-50" },
  CANCELLED: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50" },
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ productId: number; productName: string } | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    Promise.all([
      api.get("/orders/" + orderId),
      api.get("/orders/" + orderId + "/invoices"),
    ])
      .then(([orderRes, invRes]) => {
        setOrder(orderRes.data.data);
        setInvoices(invRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const downloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      setToast({ visible: true, message: "Preparando descarga..." });
      const response = await api.get("/invoices/" + invoiceId + "/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", invoiceNumber + ".pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast({ visible: true, message: "✓ Factura descargada correctamente" });
    } catch {
      setToast({ visible: true, message: "Error al descargar la factura" });
    }
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post("/products/" + reviewModal.productId + "/reviews", {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: "" });
      setToast({ visible: true, message: "¡Reseña publicada correctamente! ⭐" });
    } catch {
      setToast({ visible: true, message: "Ya publicaste una reseña para este producto" });
      setReviewModal(null);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#86868B]">Cargando orden...</p>
    </div>
  );
  if (!order) return <p className="text-red-500">Orden no encontrada</p>;

  const statusInfo = statusConfig[order.status] || statusConfig.CONFIRMED;
  const isDelivered = order.status === "DELIVERED";

  return (
    <div className="max-w-3xl">
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Modal de reseña */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-[#1D1D1F] mb-1">Dejar reseña</h2>
              <p className="text-sm text-[#86868B] mb-5">{reviewModal.productName}</p>

              <div className="flex items-center gap-3 mb-5">
                <p className="text-sm font-medium text-[#1D1D1F]">Calificación:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      <Star
                        size={26}
                        className={star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Cuéntanos tu experiencia con este producto..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="flex-1 bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Publicando..." : "Publicar reseña"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link href="/orders" className="text-[#86868B] hover:text-[#1D1D1F] text-sm transition-colors">
          ← Mis órdenes
        </Link>
        {isDelivered && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} />
            Orden completada
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] font-mono">{order.order_number}</h1>
          <p className="text-[#86868B] text-sm mt-1">
            {new Date(order.created_at).toLocaleString("es-HN", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={"px-3 py-1.5 rounded-full text-sm font-medium " + statusInfo.color + " " + statusInfo.bg}>
          {statusInfo.label}
        </span>
      </motion.div>

      {/* Info de entrega */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 shadow-sm mb-4"
      >
        <h2 className="font-medium text-[#1D1D1F] mb-3">Información de entrega</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#86868B] mb-0.5">Dirección</p>
            <p className="text-sm text-[#1D1D1F]">{order.shipping_address}</p>
          </div>
          <div>
            <p className="text-xs text-[#86868B] mb-0.5">Método de pago</p>
            <p className="text-sm text-[#1D1D1F]">
              {order.payment_method}
              {order.payment?.card_last_digits ? " **** " + order.payment.card_last_digits : ""}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subórdenes */}
      {(order.store_orders || []).map((so, soIndex) => (
        <motion.div
          key={so.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + soIndex * 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[#1D1D1F]">{so.store?.business_name}</h2>
            <span className="text-xs font-mono text-[#86868B]">{so.sub_order_number}</span>
          </div>

          <div className="space-y-3 mb-4">
            {(so.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-[#1D1D1F]">{item.product_name}</p>
                  <p className="text-xs text-[#86868B]">
                    {"x" + item.quantity + " × L. " + Number(item.unit_price).toLocaleString("es-HN")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-medium text-[#1D1D1F]">
                    {"L. " + Number(item.line_total).toLocaleString("es-HN")}
                  </p>
                  {isDelivered && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setReviewModal({ productId: item.product_id, productName: item.product_name })}
                      className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Star size={11} className="fill-yellow-500" />
                      Reseñar
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-[#86868B]">
              <span>Subtotal</span>
              <span>{"L. " + Number(so.subtotal).toLocaleString("es-HN")}</span>
            </div>
            <div className="flex justify-between text-sm text-[#86868B]">
              <span>Impuestos (15%)</span>
              <span>{"L. " + Number(so.tax_amount).toLocaleString("es-HN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#1D1D1F]">
              <span>Total</span>
              <span>{"L. " + Number(so.total).toLocaleString("es-HN")}</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Total general */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1D1D1F] rounded-2xl p-5 mb-4 flex items-center justify-between"
      >
        <p className="text-white font-medium">Total general</p>
        <p className="text-white text-xl font-bold">
          {"L. " + Number(order.total_amount).toLocaleString("es-HN")}
        </p>
      </motion.div>

      {/* Facturas */}
      {invoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h2 className="font-medium text-[#1D1D1F] mb-4 flex items-center gap-2">
            <FileText size={16} />
            Facturas
          </h2>
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                <div>
                  <p className="text-sm font-mono font-medium text-[#1D1D1F]">{inv.invoice_number}</p>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {inv.type === "CONSOLIDATED" ? "Factura consolidada" : "Factura por tienda"} ·{" "}
                    {"L. " + Number(inv.total).toLocaleString("es-HN")}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadInvoice(inv.id, inv.invoice_number)}
                  className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-black transition-colors"
                >
                  <Download size={14} />
                  Descargar PDF
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}