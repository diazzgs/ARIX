"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import api from "@/lib/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    api.get("/notifications?size=50")
      .then((res) => setNotifications(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    fetchNotifications();
  };

  const markRead = async (id: number) => {
    await api.put("/notifications/" + id + "/read");
    fetchNotifications();
  };

  const typeColor = (type: string) => {
    if (type === "ORDER") return "bg-blue-100 text-blue-700";
    if (type === "TICKET") return "bg-orange-100 text-orange-700";
    if (type === "CHAT") return "bg-green-100 text-green-700";
    if (type === "STORE") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Notificaciones</h1>
          <p className="text-[#86868B] mt-1">Mantente al día con tu actividad</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <Check size={16} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Bell size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[#86868B]">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={"bg-white rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4" + (!notif.is_read ? " border-l-4 border-[#1D1D1F]" : "")}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + typeColor(notif.type)}>
                    {notif.type}
                  </span>
                  <p className="text-xs text-[#86868B]">
                    {new Date(notif.created_at).toLocaleString("es-HN")}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#1D1D1F]">{notif.title}</p>
                <p className="text-sm text-[#86868B] mt-0.5">{notif.message}</p>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markRead(notif.id)}
                  className="text-[#86868B] hover:text-[#1D1D1F] transition-colors mt-1"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}