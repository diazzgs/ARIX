"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";
import Toast from "@/components/shared/Toast";

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
  if (type === "CHAT") return "bg-green-100 text-green-700";
  if (type === "STORE") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
};

const typeIcon = (type: string) => {
  if (type === "ORDER") return "🛍️";
  if (type === "TICKET") return "🎫";
  if (type === "CHAT") return "💬";
  if (type === "STORE") return "🏪";
  return "🔔";
};

export default function StoreNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const fetchNotifications = () => {
    api.get("/notifications?size=50")
      .then((res) => setNotifications(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    fetchNotifications();
    setToast({ visible: true, message: "✓ Todas marcadas como leídas" });
  };

  const markRead = async (id: number) => {
    await api.put("/notifications/" + id + "/read");
    fetchNotifications();
  };

  const deleteOne = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete("/notifications/" + id);
      fetchNotifications();
      setToast({ visible: true, message: "Notificación eliminada" });
    } catch {
      setToast({ visible: true, message: "Error al eliminar la notificación" });
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAll = async () => {
    setDeletingAll(true);
    try {
      await api.delete("/notifications/all");
      fetchNotifications();
      setToast({ visible: true, message: "✓ Todas las notificaciones eliminadas" });
    } catch {
      setToast({ visible: true, message: "Error al eliminar las notificaciones" });
    } finally {
      setDeletingAll(false);
      setConfirmDeleteAll(false);
    }
  };

  return (
    <PageTransition>
      <div>
        <Toast
          message={toast.message}
          visible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        {/* Modal confirmar borrar todas */}
        <AnimatePresence>
          {confirmDeleteAll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setConfirmDeleteAll(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-[#1D1D1F] text-center mb-2">
                  ¿Eliminar todas?
                </h2>
                <p className="text-sm text-[#86868B] text-center mb-6">
                  Se eliminarán permanentemente todas las notificaciones. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={deleteAll}
                    disabled={deletingAll}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deletingAll ? "Eliminando..." : "Sí, eliminar todas"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F]">Notificaciones</h1>
              <p className="text-[#86868B] mt-0.5 text-sm">
                {unreadCount > 0 ? (
                  <span className="text-[#1D1D1F] font-medium">{unreadCount} sin leer</span>
                ) : "Todo al día"}
                {notifications.length > 0 && " · " + notifications.length + " total"}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-[#1D1D1F] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors px-3 py-2 rounded-xl hover:bg-white"
                >
                  <Check size={15} />
                  Marcar leídas
                </button>
              )}
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
              >
                <Trash2 size={15} />
                Eliminar todas
              </button>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="bg-white rounded-2xl h-20 shadow-sm"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-16 text-center shadow-sm"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bell size={40} className="text-gray-300 mx-auto mb-4" />
            </motion.div>
            <p className="text-lg font-medium text-[#1D1D1F]">Sin notificaciones</p>
            <p className="text-sm text-[#86868B] mt-1">Aquí aparecerán los pedidos, tickets y avisos de tu tienda</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={"bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4 group " + (!notif.is_read ? "border-l-4 border-[#1D1D1F]" : "")}
                >
                  {/* Icono */}
                  <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center shrink-0 text-lg">
                    {typeIcon(notif.type)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + typeColor(notif.type)}>
                        {notif.type}
                      </span>
                      <p className="text-xs text-[#86868B]">
                        {new Date(notif.created_at).toLocaleString("es-HN", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-[#1D1D1F] rounded-full" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1D1D1F]">{notif.title}</p>
                    <p className="text-sm text-[#86868B] mt-0.5">{notif.message}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={() => markRead(notif.id)}
                        title="Marcar como leída"
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteOne(notif.id)}
                      disabled={deletingId === notif.id}
                      title="Eliminar"
                      className="p-1.5 rounded-lg text-[#86868B] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}