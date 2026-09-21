"use client";
import PageTransition from "@/components/shared/PageTransition";
import { useEffect, useState } from "react";
import { ShoppingBag, Heart, Ticket, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(0);
  const [favorites, setFavorites] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, favRes, ticketsRes, notifRes] = await Promise.all([
          api.get("/orders?size=1"),
          api.get("/favorites?size=1"),
          api.get("/tickets?size=1"),
          api.get("/notifications/unread-count"),
        ]);
        setOrders(ordersRes.data.data.total_elements);
        setFavorites(favRes.data.data.total_elements);
        setTickets(ticketsRes.data.data.total_elements);
        setNotifications(notifRes.data.data.unread_count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { label: "Mis órdenes", value: orders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Favoritos", value: favorites, icon: Heart, color: "bg-pink-50 text-pink-600" },
    { label: "Mis tickets", value: tickets, icon: Ticket, color: "bg-orange-50 text-orange-600" },
    { label: "Notificaciones", value: notifications, icon: Bell, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <PageTransition>
    <div>
      <h1 className="text-2xl font-bold text-[#1D1D1F]">
        Hola, {user?.full_name?.split(" ")[0]} 👋
      </h1>
      <p className="text-[#86868B] mt-1 mb-8">Bienvenido a tu panel personal de ARIX</p>

      {loading ? (
        <p className="text-[#86868B]">Cargando...</p>
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
    </PageTransition>
  );
}