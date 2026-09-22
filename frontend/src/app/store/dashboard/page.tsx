"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Warehouse, Ticket, TrendingUp, DollarSign, BarChart3, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface StoreData {
  business_name: string;
  status: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: { quantity: number; line_total: number }[];
}

export default function StoreDashboardPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, productsRes, ordersRes, lowStockRes, ticketsRes] = await Promise.all([
          api.get("/store/me"),
          api.get("/store/products?size=1"),
          api.get("/store/orders?size=100"),
          api.get("/store/inventory/low-stock"),
          api.get("/store/tickets?size=1"),
        ]);
        setStore(storeRes.data.data);
        setProducts(productsRes.data.data.total_elements);
        setOrders(ordersRes.data.data.content);
        setLowStock(lowStockRes.data.data.length);
        setTickets(ticketsRes.data.data.total_elements);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calcular estadísticas financieras
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const pendingOrders = orders.filter((o) =>
    ["CONFIRMED", "PREPARING", "SHIPPED"].includes(o.status)
  );
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  const totalRevenue = deliveredOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const pendingRevenue = pendingOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
  const conversionRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0;

  // Órdenes por mes (últimos 3 meses)
  const monthlyData = orders.reduce((acc: Record<string, number>, order) => {
    const month = new Date(order.created_at).toLocaleDateString("es-HN", {
      month: "short",
      year: "numeric",
    });
    acc[month] = (acc[month] || 0) + Number(order.total);
    return acc;
  }, {});

  const statCards = [
    {
      label: "Ingresos totales",
      value: "L. " + totalRevenue.toLocaleString("es-HN", { minimumFractionDigits: 2 }),
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
      desc: "Órdenes entregadas",
    },
    {
      label: "Ingresos pendientes",
      value: "L. " + pendingRevenue.toLocaleString("es-HN", { minimumFractionDigits: 2 }),
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
      desc: "En proceso de entrega",
    },
    {
      label: "Ticket promedio",
      value: "L. " + avgOrderValue.toLocaleString("es-HN", { minimumFractionDigits: 2 }),
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
      desc: "Por orden entregada",
    },
    {
      label: "Tasa de éxito",
      value: conversionRate.toFixed(1) + "%",
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
      desc: "Órdenes completadas",
    },
  ];

  const operationCards = [
    { label: "Productos activos", value: products, icon: Package, color: "bg-gray-50 text-gray-600" },
    { label: "Órdenes totales", value: totalOrders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Stock bajo", value: lowStock, icon: Warehouse, color: "bg-red-50 text-red-600" },
    { label: "Tickets abiertos", value: tickets, icon: Ticket, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <PageTransition>
      <div>
        <h1 className="text-2xl font-bold text-[#1D1D1F]">
          {store ? store.business_name : "Dashboard"}
        </h1>
        <p className="text-[#86868B] mt-1 mb-8">Panel de administración de tu tienda</p>

        {loading ? (
          <p className="text-[#86868B]">Cargando estadísticas...</p>
        ) : (
          <>
            {/* Financiero */}
            <p className="text-sm font-medium text-[#86868B] uppercase tracking-widest mb-3">
              Resumen financiero
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, desc }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className={"inline-flex p-3 rounded-xl mb-4 " + color}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-[#1D1D1F]">{value}</p>
                  <p className="text-sm font-medium text-[#1D1D1F] mt-1">{label}</p>
                  <p className="text-xs text-[#86868B] mt-0.5">{desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Operacional */}
            <p className="text-sm font-medium text-[#86868B] uppercase tracking-widest mb-3">
              Operaciones
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {operationCards.map(({ label, value, icon: Icon, color }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className={"inline-flex p-3 rounded-xl mb-4 " + color}>
                    <Icon size={20} />
                  </div>
                  <p className="text-3xl font-bold text-[#1D1D1F]">{value}</p>
                  <p className="text-sm text-[#86868B] mt-1">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Estado de órdenes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="font-medium text-[#1D1D1F] mb-4">Estado de órdenes</h2>
                <div className="space-y-3">
                  {[
                    { label: "Entregadas", count: deliveredOrders.length, color: "bg-green-500", total: totalOrders },
                    { label: "En proceso", count: pendingOrders.length, color: "bg-blue-500", total: totalOrders },
                    { label: "Canceladas", count: cancelledOrders.length, color: "bg-red-400", total: totalOrders },
                  ].map(({ label, count, color, total }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#86868B]">{label}</span>
                        <span className="font-medium text-[#1D1D1F]">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={"h-2 rounded-full " + color}
                          style={{ width: total > 0 ? (count / total * 100) + "%" : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="font-medium text-[#1D1D1F] mb-4">Ingresos por mes</h2>
                {Object.keys(monthlyData).length === 0 ? (
                  <p className="text-sm text-[#86868B]">No hay datos de ventas aún</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(monthlyData).slice(-4).map(([month, revenue]) => (
                      <div key={month}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#86868B] capitalize">{month}</span>
                          <span className="font-medium text-[#1D1D1F]">
                            {"L. " + Number(revenue).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-[#1D1D1F]"
                            style={{
                              width: (Number(revenue) / Math.max(...Object.values(monthlyData)) * 100) + "%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Alertas */}
            {(lowStock > 0 || cancelledOrders.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle size={18} className="text-yellow-600" />
                  <h2 className="font-medium text-yellow-800">Alertas</h2>
                </div>
                <div className="space-y-2">
                  {lowStock > 0 && (
                    <p className="text-sm text-yellow-700">
                      ⚠️ <strong>{lowStock} producto(s)</strong> con stock bajo o agotado — revisa tu inventario
                    </p>
                  )}
                  {cancelledOrders.length > 0 && (
                    <p className="text-sm text-yellow-700">
                      ❌ <strong>{cancelledOrders.length} orden(es)</strong> canceladas en el historial
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}