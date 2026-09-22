"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Users, Package, ShoppingBag, Ticket, Star,
  DollarSign, TrendingUp, Wallet, Crown,
} from "lucide-react";
import PageTransition from "@/components/shared/PageTransition";
import api from "@/lib/api";

interface TopStoreStat {
  id: number;
  business_name: string;
  revenue: number;
  orders_count: number;
}

interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  orders_count: number;
}

interface DashboardStats {
  stores_total: number;
  stores_active: number;
  stores_suspended: number;
  users_total: number;
  users_clients: number;
  users_store_admins: number;
  users_super_admins: number;
  products_total: number;
  products_active: number;
  orders_total: number;
  orders_pending: number;
  orders_confirmed: number;
  orders_preparing: number;
  orders_shipped: number;
  orders_delivered: number;
  orders_cancelled: number;
  revenue_total: number;
  revenue_last_30_days: number;
  average_order_value: number;
  tickets_total: number;
  tickets_open: number;
  tickets_in_progress: number;
  tickets_resolved: number;
  tickets_closed: number;
  reviews_total: number;
  reviews_reported: number;
  top_stores: TopStoreStat[];
  revenue_by_month: MonthlyRevenuePoint[];
}

const money = (n: number) =>
  "L. " + Number(n).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const count = (n: number) => Number(n).toLocaleString("es-HN");

const statusMeta = [
  { key: "orders_pending" as const, label: "Pendientes", dot: "bg-gray-400", bar: "bg-gray-400" },
  { key: "orders_confirmed" as const, label: "Confirmados", dot: "bg-blue-500", bar: "bg-blue-500" },
  { key: "orders_preparing" as const, label: "Preparando", dot: "bg-purple-500", bar: "bg-purple-500" },
  { key: "orders_shipped" as const, label: "Enviados", dot: "bg-indigo-500", bar: "bg-indigo-500" },
  { key: "orders_delivered" as const, label: "Entregados", dot: "bg-green-500", bar: "bg-green-500" },
  { key: "orders_cancelled" as const, label: "Cancelados", dot: "bg-red-500", bar: "bg-red-500" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  useEffect(() => {
    api.get("/admin/dashboard/stats")
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Dashboard</h1>
          <p className="text-[#86868B] mt-1 mb-8">Resumen general de la plataforma ARIX</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="bg-white rounded-2xl h-28 shadow-sm"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.06 }}
                className="bg-white rounded-2xl h-24 shadow-sm"
              />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!stats) {
    return (
      <PageTransition>
        <p className="text-red-500">No se pudieron cargar las estadísticas.</p>
      </PageTransition>
    );
  }

  const financialCards = [
    { label: "Ingresos totales", value: money(stats.revenue_total), icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Ingresos (últimos 30 días)", value: money(stats.revenue_last_30_days), icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { label: "Valor promedio de pedido", value: money(stats.average_order_value), icon: Wallet, color: "bg-purple-50 text-purple-600" },
  ];

  const kpiCards = [
    { label: "Tiendas activas", sub: stats.stores_suspended > 0 ? stats.stores_suspended + " suspendidas" : "Todas activas", value: stats.stores_active, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Usuarios registrados", sub: stats.users_clients + " clientes · " + stats.users_store_admins + " tiendas", value: stats.users_total, icon: Users, color: "bg-green-50 text-green-600" },
    { label: "Productos activos", sub: stats.products_total + " en total", value: stats.products_active, icon: Package, color: "bg-orange-50 text-orange-600" },
    { label: "Pedidos totales", sub: stats.orders_delivered + " entregados", value: stats.orders_total, icon: ShoppingBag, color: "bg-indigo-50 text-indigo-600" },
    { label: "Tickets abiertos", sub: stats.tickets_in_progress + " en progreso", value: stats.tickets_open, icon: Ticket, color: "bg-red-50 text-red-600" },
    { label: "Tickets resueltos", sub: stats.tickets_closed + " cerrados", value: stats.tickets_resolved, icon: Ticket, color: "bg-teal-50 text-teal-600" },
    { label: "Reseñas totales", sub: "En toda la plataforma", value: stats.reviews_total, icon: Star, color: "bg-yellow-50 text-yellow-600" },
    { label: "Reseñas reportadas", sub: stats.reviews_reported > 0 ? "Requieren revisión" : "Sin pendientes", value: stats.reviews_reported, icon: Star, color: stats.reviews_reported > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500" },
  ];

  const maxRevenue = Math.max(...stats.revenue_by_month.map((m) => Number(m.revenue)), 1);
  const maxTopRevenue = Math.max(...stats.top_stores.map((s) => Number(s.revenue)), 1);
  const ordersForStatus = stats.orders_total || 1;

  return (
    <PageTransition>
      <div>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Dashboard</h1>
          <p className="text-[#86868B] mt-1 mb-8">Resumen general de la plataforma ARIX</p>
        </motion.div>

        {/* Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {financialCards.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
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

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map(({ label, sub, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className={"inline-flex p-2.5 rounded-xl mb-3 " + color}>
                <Icon size={17} />
              </div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{count(value)}</p>
              <p className="text-xs font-medium text-[#1D1D1F] mt-1">{label}</p>
              <p className="text-xs text-[#86868B] mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Ingresos por mes + Pedidos por estado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2"
          >
            <p className="text-sm font-semibold text-[#1D1D1F] mb-1">Ingresos por mes</p>
            <p className="text-xs text-[#86868B] mb-6">Últimos 6 meses, suma de órdenes confirmadas</p>

            <div className="flex items-end justify-between gap-3" style={{ height: 180 }}>
              {stats.revenue_by_month.map((point, i) => {
                const heightPx = Math.max((Number(point.revenue) / maxRevenue) * 160, Number(point.revenue) > 0 ? 6 : 2);
                return (
                  <div
                    key={point.month}
                    className="flex-1 flex flex-col items-center justify-end h-full relative"
                    onMouseEnter={() => setHoveredMonth(i)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    <AnimatePresence>
                      {hoveredMonth === i && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute -top-2 -translate-y-full bg-[#1D1D1F] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap z-10 shadow-lg"
                        >
                          <p className="font-semibold">{money(point.revenue)}</p>
                          <p className="text-gray-300">{point.orders_count} pedido{point.orders_count !== 1 ? "s" : ""}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: heightPx }}
                      transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" }}
                      className={"w-full max-w-[36px] rounded-t-lg mx-auto transition-colors " + (hoveredMonth === i ? "bg-[#1D1D1F]" : "bg-[#1D1D1F]/80")}
                    />
                    <p className="text-xs text-[#86868B] mt-2 whitespace-nowrap">{point.month}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-[#1D1D1F] mb-1">Pedidos por estado</p>
            <p className="text-xs text-[#86868B] mb-5">{count(stats.orders_total)} pedidos en total</p>

            {stats.orders_total === 0 ? (
              <p className="text-sm text-[#86868B] text-center py-6">Todavía no hay pedidos</p>
            ) : (
              <>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 gap-0.5 mb-5">
                  {statusMeta.map(({ key, label, bar }) => {
                    const value = stats[key];
                    if (value === 0) return null;
                    return (
                      <motion.div
                        key={key}
                        initial={{ width: 0 }}
                        animate={{ width: (value / ordersForStatus) * 100 + "%" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={bar}
                        title={label + ": " + value}
                      />
                    );
                  })}
                </div>
                <div className="space-y-2.5">
                  {statusMeta.map(({ key, label, dot }) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={"w-2 h-2 rounded-full " + dot} />
                        <span className="text-[#86868B]">{label}</span>
                      </div>
                      <span className="font-medium text-[#1D1D1F]">{count(stats[key])}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Top tiendas + Soporte/Reseñas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-[#1D1D1F] mb-1">Tiendas con más ingresos</p>
            <p className="text-xs text-[#86868B] mb-5">Top 5 por ingresos totales</p>

            {stats.top_stores.length === 0 ? (
              <p className="text-sm text-[#86868B] text-center py-6">Todavía no hay ventas registradas</p>
            ) : (
              <div className="space-y-4">
                {stats.top_stores.map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className={"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold " + (i === 0 ? "bg-[#1D1D1F] text-white" : "bg-gray-100 text-[#86868B]")}>
                      {i === 0 ? <Crown size={13} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-[#1D1D1F] truncate">{store.business_name}</p>
                        <p className="text-sm font-semibold text-[#1D1D1F] shrink-0 ml-2">{money(store.revenue)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: (Number(store.revenue) / maxTopRevenue) * 100 + "%" }}
                            transition={{ duration: 0.6, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                            className="h-full bg-[#1D1D1F]"
                          />
                        </div>
                        <p className="text-xs text-[#86868B] shrink-0">{store.orders_count} pedido{store.orders_count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-[#1D1D1F] mb-5">Soporte y reseñas</p>

            <p className="text-xs font-medium text-[#86868B] mb-3">Tickets de soporte</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { label: "Abiertos", value: stats.tickets_open, color: "text-red-600 bg-red-50" },
                { label: "En progreso", value: stats.tickets_in_progress, color: "text-orange-600 bg-orange-50" },
                { label: "Resueltos", value: stats.tickets_resolved, color: "text-green-600 bg-green-50" },
                { label: "Cerrados", value: stats.tickets_closed, color: "text-gray-600 bg-gray-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className={"rounded-xl p-3 text-center " + color}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[10px] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-medium text-[#86868B] mb-3">Reseñas</p>
            <div className="flex items-center justify-between bg-[#F5F5F7] rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-[#1D1D1F]">{stats.reviews_total} reseñas publicadas</p>
                <p className="text-xs text-[#86868B] mt-0.5">En toda la plataforma</p>
              </div>
              {stats.reviews_reported > 0 ? (
                <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Star size={12} className="fill-red-600" />
                  {stats.reviews_reported} reportada{stats.reviews_reported !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-xs text-[#86868B]">Sin reportes pendientes</span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}