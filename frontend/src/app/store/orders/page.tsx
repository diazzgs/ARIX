"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronDown, ChevronUp, Package } from "lucide-react";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";
import Toast from "@/components/shared/Toast";

interface StoreOrder {
  id: number;
  sub_order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items: { product_name: string; quantity: number; line_total: number }[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50" },
  PREPARING: { label: "Preparando", color: "text-purple-700", bg: "bg-purple-50" },
  SHIPPED: { label: "Enviado", color: "text-indigo-700", bg: "bg-indigo-50" },
  DELIVERED: { label: "Entregado", color: "text-green-700", bg: "bg-green-50" },
  CANCELLED: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50" },
};

const nextStatus: Record<string, string> = {
  CONFIRMED: "PREPARING",
  PREPARING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const nextLabel: Record<string, string> = {
  CONFIRMED: "Marcar Preparando",
  PREPARING: "Marcar Enviado",
  SHIPPED: "Marcar Entregado",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState<number | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = () => {
    api.get("/store/orders?size=100")
      .then((res) => setOrders(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const advance = async (orderId: number, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    setAdvancing(orderId);
    try {
      await api.put("/store/orders/" + orderId + "/status", { status: next });
      setToast({ visible: true, message: "✓ Pedido actualizado a " + statusConfig[next]?.label });
      fetchOrders();
    } catch {
      setToast({ visible: true, message: "Error al actualizar el pedido" });
    } finally {
      setAdvancing(null);
    }
  };

  const counts = {
    ALL: orders.length,
    CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const totalRevenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <PageTransition>
      <div>
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Pedidos</h1>
          <p className="text-[#86868B] mt-1">Gestiona los pedidos de tu tienda</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total pedidos", value: orders.length, color: "text-[#1D1D1F]", bg: "bg-white" },
            { label: "Pendientes", value: counts.CONFIRMED + counts.PREPARING + counts.SHIPPED, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Entregados", value: counts.DELIVERED, color: "text-green-600", bg: "bg-green-50" },
            { label: "Ingresos entregados", value: "L. " + totalRevenue.toLocaleString("es-HN", { minimumFractionDigits: 0 }), color: "text-[#1D1D1F]", bg: "bg-[#F5F5F7]" },
          ].map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={"rounded-2xl p-5 shadow-sm " + bg}
            >
              <p className={"text-2xl font-bold " + color}>{value}</p>
              <p className="text-xs text-[#86868B] mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 mb-5 flex-wrap"
        >
          {[
            { key: "ALL", label: "Todos" },
            { key: "CONFIRMED", label: "Confirmados" },
            { key: "PREPARING", label: "Preparando" },
            { key: "SHIPPED", label: "Enviados" },
            { key: "DELIVERED", label: "Entregados" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={"px-4 py-2 rounded-xl text-sm font-medium transition-colors " + (filter === key ? "bg-[#1D1D1F] text-white" : "bg-white text-[#86868B] hover:bg-gray-50 shadow-sm")}
            >
              {label}
              <span className={"ml-1.5 text-xs opacity-70"}>{counts[key as keyof typeof counts]}</span>
            </button>
          ))}
        </motion.div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="bg-white rounded-2xl h-24 shadow-sm"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <ShoppingBag size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#86868B]">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((order, index) => {
                const statusInfo = statusConfig[order.status] || statusConfig.CONFIRMED;
                const isExpanded = expandedId === order.id;
                const canAdvance = !!nextStatus[order.status];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  >
                    <div
                      className="p-5 cursor-pointer hover:bg-[#F9F9F9] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + statusInfo.bg}>
                            <Package size={16} className={statusInfo.color} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F] font-mono">{order.sub_order_number}</p>
                            <p className="text-xs text-[#86868B] mt-0.5">
                              {order.customer_name} · {new Date(order.created_at).toLocaleDateString("es-HN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + statusInfo.color + " " + statusInfo.bg}>
                            {statusInfo.label}
                          </span>
                          <p className="text-sm font-bold text-[#1D1D1F]">
                            {"L. " + Number(order.total).toLocaleString("es-HN")}
                          </p>
                          {isExpanded ? <ChevronUp size={16} className="text-[#86868B]" /> : <ChevronDown size={16} className="text-[#86868B]" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-[#86868B]">{item.product_name} <span className="text-[#1D1D1F] font-medium">x{item.quantity}</span></span>
                                  <span className="font-medium text-[#1D1D1F]">{"L. " + Number(item.line_total).toLocaleString("es-HN")}</span>
                                </div>
                              ))}
                            </div>
                            {canAdvance && (
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={(e) => { e.stopPropagation(); advance(order.id, order.status); }}
                                disabled={advancing === order.id}
                                className="w-full bg-[#1D1D1F] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                              >
                                {advancing === order.id ? "Actualizando..." : nextLabel[order.status]}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}