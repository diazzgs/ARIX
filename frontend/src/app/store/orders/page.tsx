"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StoreOrder {
  id: number;
  sub_order_number: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items: { product_name: string; quantity: number }[];
}

const statusColor = (s: string) => {
  if (s === "CONFIRMED") return "bg-blue-100 text-blue-700";
  if (s === "PREPARING") return "bg-yellow-100 text-yellow-700";
  if (s === "SHIPPED") return "bg-purple-100 text-purple-700";
  if (s === "DELIVERED") return "bg-green-100 text-green-700";
  if (s === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const nextStatus: Record<string, string> = {
  CONFIRMED: "PREPARING",
  PREPARING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get("/store/orders?size=50")
      .then((res) => setOrders(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const advance = async (orderId: number, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    await api.put(`/store/orders/${orderId}/status`, { status: next });
    fetchOrders();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Pedidos</h1>
        <p className="text-[#86868B] mt-1">Gestiona los pedidos de tu tienda</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No hay pedidos aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-sm font-medium text-[#1D1D1F]">{order.sub_order_number}</p>
                  <p className="text-xs text-[#86868B]">Cliente: {order.customer_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-bold text-[#1D1D1F]">L. {Number(order.total).toLocaleString("es-HN")}</p>
                </div>
              </div>
              <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                <div className="text-xs text-[#86868B]">
                  {order.items.map((item) => `${item.product_name} x${item.quantity}`).join(", ")}
                </div>
                {nextStatus[order.status] && (
                  <button
                    onClick={() => advance(order.id, order.status)}
                    className="text-xs bg-[#1D1D1F] text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors"
                  >
                    Marcar como {nextStatus[order.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}