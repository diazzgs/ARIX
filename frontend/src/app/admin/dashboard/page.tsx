"use client";

import { useEffect, useState } from "react";
import { Store, Users, ShoppingBag, Ticket } from "lucide-react";
import api from "@/lib/api";

interface Stats {
  stores: number;
  users: number;
  orders: number;
  tickets: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ stores: 0, users: 0, orders: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [storesRes, usersRes, ticketsRes] = await Promise.all([
          api.get("/admin/stores?size=1"),
          api.get("/admin/users?size=1"),
          api.get("/admin/tickets?size=1"),
        ]);
        setStats({
          stores: storesRes.data.data.total_elements,
          users: usersRes.data.data.total_elements,
          orders: 0,
          tickets: ticketsRes.data.data.total_elements,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Tiendas activas", value: stats.stores, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Usuarios registrados", value: stats.users, icon: Users, color: "bg-green-50 text-green-600" },
    { label: "Órdenes totales", value: stats.orders, icon: ShoppingBag, color: "bg-purple-50 text-purple-600" },
    { label: "Tickets de soporte", value: stats.tickets, icon: Ticket, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1D1D1F]">Dashboard</h1>
      <p className="text-[#86868B] mt-1 mb-8">Resumen general de la plataforma ARIX</p>

      {loading ? (
        <p className="text-[#86868B]">Cargando estadísticas...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold text-[#1D1D1F]">{value}</p>
              <p className="text-sm text-[#86868B] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}