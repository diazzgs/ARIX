"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeColor = (type: string) => {
  if (type === "ORDER") return "bg-blue-100 text-blue-700";
  if (type === "TICKET") return "bg-orange-100 text-orange-700";
  if (type === "STORE") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
};

interface Props {
  unreadCount: number;
  onCountChange: (count: number) => void;
}

export default function NotificationDropdown({ unreadCount, onCountChange }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications?size=10");
      setNotifications(res.data.data.content);
    } catch { console.error("Error fetching notifications"); }
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const markRead = async (id: number) => {
    await api.put("/notifications/" + id + "/read");
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    onCountChange(Math.max(0, unreadCount - 1));
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onCountChange(0);
  };

  const deleteOne = async (id: number) => {
    await api.delete("/notifications/" + id);
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) onCountChange(Math.max(0, unreadCount - 1));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-[#86868B] hover:text-[#1D1D1F]"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header dropdown */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#1D1D1F]">Notificaciones</p>
                {unreadCount > 0 && (
                  <span className="bg-[#1D1D1F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                >
                  <Check size={12} />
                  Marcar leídas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#86868B]">Cargando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-[#86868B]">Sin notificaciones</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={"flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group " + (!notif.is_read ? "border-l-2 border-l-[#1D1D1F]" : "")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={"px-1.5 py-0.5 rounded text-xs font-medium " + typeColor(notif.type)}>
                            {notif.type}
                          </span>
                          {!notif.is_read && <span className="w-1.5 h-1.5 bg-[#1D1D1F] rounded-full" />}
                        </div>
                        <p className="text-xs font-semibold text-[#1D1D1F]">{notif.title}</p>
                        <p className="text-xs text-[#86868B] truncate">{notif.message}</p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(notif.created_at).toLocaleString("es-HN", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="p-1 rounded-lg text-[#86868B] hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Marcar leída"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteOne(notif.id)}
                          className="p-1 rounded-lg text-[#86868B] hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <Link
                href="/store/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-[#1D1D1F] font-medium hover:underline"
              >
                Ver todas →
              </Link>
              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    await api.delete("/notifications/all");
                    setNotifications([]);
                    onCountChange(0);
                  }}
                  className="flex items-center gap-1 text-xs text-[#86868B] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={11} />
                  Borrar todas
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}