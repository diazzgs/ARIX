"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const statusColor = (s: string) => {
  if (s === "CONFIRMED") return "bg-blue-100 text-blue-700";
  if (s === "PREPARING") return "bg-yellow-100 text-yellow-700";
  if (s === "SHIPPED") return "bg-purple-100 text-purple-700";
  if (s === "DELIVERED") return "bg-green-100 text-green-700";
  if (s === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Mis Órdenes</h1>
        <p className="text-[#86868B] mt-1">Historial de tus compras en ARIX</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No tienes órdenes aún</p>
          <Link href="/catalog" className="mt-4 inline-block text-sm font-medium text-[#1D1D1F] underline">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Orden</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Total</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Fecha</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono font-medium text-[#1D1D1F]">{order.order_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">
                      L. {Number(order.total_amount).toLocaleString("es-HN")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#86868B]">
                      {new Date(order.created_at).toLocaleDateString("es-HN")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm text-[#1D1D1F] font-medium hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}