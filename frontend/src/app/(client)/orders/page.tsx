"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface StoreOrder {
  store: { business_name: string };
  items: OrderItem[];
}

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  store_orders: StoreOrder[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "text-yellow-700", bg: "bg-yellow-50" },
  CONFIRMED: { label: "Confirmado", color: "text-blue-700", bg: "bg-blue-50" },
  PREPARING: { label: "Preparando", color: "text-purple-700", bg: "bg-purple-50" },
  SHIPPED: { label: "Enviado", color: "text-indigo-700", bg: "bg-indigo-50" },
  DELIVERED: { label: "Entregado", color: "text-green-700", bg: "bg-green-50" },
  CANCELLED: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50" },
};

const statusSteps = ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders?size=50")
      .then((res) => setOrders(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Mis Órdenes</h1>
          <p className="text-[#86868B] mt-1">Historial de tus compras en ARIX</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="bg-white rounded-2xl h-32 shadow-sm"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-16 text-center shadow-sm"
          >
            <ShoppingBag size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-[#1D1D1F]">No tienes órdenes aún</p>
            <p className="text-[#86868B] text-sm mt-1">Explora el catálogo y realiza tu primera compra</p>
            <Link
              href="/catalog"
              className="mt-6 inline-block bg-[#1D1D1F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors"
            >
              Ir al catálogo
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const statusInfo = statusConfig[order.status] || statusConfig.CONFIRMED;
              const currentStep = statusSteps.indexOf(order.status);
              const storeOrders = order.store_orders || [];
              const allStores = storeOrders.map((so) => so.store?.business_name || "").filter(Boolean).join(", ");
              const allItems = storeOrders.flatMap((so) => so.items || []);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  whileHover={{ y: -2 }}
                >
                  <Link href={"/orders/" + order.id} className="block">
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center">
                            <Package size={18} className="text-[#86868B]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1D1D1F] font-mono">
                              {order.order_number}
                            </p>
                            <p className="text-xs text-[#86868B]">
                              {new Date(order.created_at).toLocaleDateString("es-HN", {
                                year: "numeric", month: "long", day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#1D1D1F]">
                              {"L. " + Number(order.total_amount).toLocaleString("es-HN")}
                            </p>
                            <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + statusInfo.color + " " + statusInfo.bg}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <ChevronRight size={18} className="text-gray-300" />
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      {currentStep >= 0 && order.status !== "CANCELLED" && (
                        <div className="mb-4">
                          <div className="flex items-center">
                            {statusSteps.map((step, i) => (
                              <div key={step} className="flex items-center flex-1 last:flex-none">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: index * 0.07 + i * 0.1 }}
                                  className={"w-3 h-3 rounded-full border-2 shrink-0 " + (i <= currentStep ? "bg-[#1D1D1F] border-[#1D1D1F]" : "bg-white border-gray-300")}
                                />
                                {i < statusSteps.length - 1 && (
                                  <div className={"flex-1 h-0.5 mx-1 " + (i < currentStep ? "bg-[#1D1D1F]" : "bg-gray-200")} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-1.5">
                            {statusSteps.map((step) => (
                              <p key={step} className="text-xs text-[#86868B]">
                                {statusConfig[step]?.label}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          {allStores && (
                            <p className="text-xs text-[#86868B]">
                              {allStores} · {allItems.length} producto{allItems.length !== 1 ? "s" : ""}
                            </p>
                          )}
                          {allItems.length > 0 && (
                            <p className="text-xs text-[#86868B] mt-0.5 truncate max-w-xs">
                              {allItems.slice(0, 2).map((i) => i.product_name + " x" + i.quantity).join(", ")}
                              {allItems.length > 2 && " +" + (allItems.length - 2) + " más"}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-[#1D1D1F] font-medium shrink-0">Ver detalle →</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}