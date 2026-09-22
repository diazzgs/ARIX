"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, CheckCircle, Clock, AlertCircle, XCircle, Store, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Message {
  id: number;
  message: string;
  sender: { id: number; full_name: string };
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  customer: { full_name: string; email: string };
  store: { id: number; business_name: string; slug: string } | null;
  assigned_admin: { full_name: string } | null;
  messages: Message[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  OPEN: { label: "Abierto", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "En progreso", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  RESOLVED: { label: "Resuelto", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "Cerrado", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "Alta", color: "bg-red-100 text-red-700" },
};

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = () => {
    api.get("/tickets/" + ticketId)
      .then((res) => setTicket(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [ticketId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // El Super Admin solo puede cambiar el estado de tickets dirigidos a la
  // plataforma (sin tienda). Los tickets de una tienda los gestiona su admin.
  const canManageStatus = ticket ? ticket.store === null : false;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post("/tickets/" + ticketId + "/messages", { message });
      setMessage("");
      fetchTicket();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    setError("");
    setUpdatingStatus(true);
    try {
      await api.put("/tickets/" + ticketId + "/status", { status });
      fetchTicket();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al actualizar el estado del ticket");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-[#86868B]">Cargando ticket...</p>
    </div>
  );
  if (!ticket) return <p className="text-red-500">Ticket no encontrado</p>;

  const statusInfo = statusConfig[ticket.status] || statusConfig.OPEN;
  const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/tickets"
          className="flex items-center gap-1 text-[#86868B] hover:text-[#1D1D1F] text-sm transition-colors"
        >
          ← Tickets
        </Link>
        {canManageStatus && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateStatus("RESOLVED")}
              disabled={updatingStatus}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              Marcar resuelto
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateStatus("CLOSED")}
              disabled={updatingStatus}
              className="flex items-center gap-2 bg-gray-100 text-[#1D1D1F] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <XCircle size={15} />
              Cerrar
            </motion.button>
          </div>
        )}
        {canManageStatus && (ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateStatus("OPEN")}
            disabled={updatingStatus}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Clock size={15} />
            Reabrir
          </motion.button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Aviso: ticket de tienda, gestión no corresponde al Super Admin */}
      {!canManageStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4"
        >
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Este ticket pertenece a la tienda <strong>{ticket.store?.business_name}</strong>. El estado
            (abrir/cerrar) lo gestiona el administrador de esa tienda; aquí puedes supervisar la conversación.
          </p>
        </motion.div>
      )}

      {/* Info del ticket */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm mb-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-mono text-[#86868B] mb-1">{ticket.ticket_number}</p>
            <h1 className="text-xl font-bold text-[#1D1D1F] mb-3">{ticket.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={"flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium " + statusInfo.color}>
                <StatusIcon size={12} />
                {statusInfo.label}
              </span>
              <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + priorityInfo.color}>
                Prioridad {priorityInfo.label}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#86868B]">
                <Store size={12} />
                {ticket.store?.business_name || "Plataforma"}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium text-[#1D1D1F]">{ticket.customer.full_name}</p>
            <p className="text-xs text-[#86868B]">{ticket.customer.email}</p>
          </div>
        </div>
        <p className="text-sm text-[#86868B] mt-4 pt-4 border-t border-gray-100">{ticket.description}</p>
      </motion.div>

      {/* Mensajes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        style={{ minHeight: "300px", maxHeight: "420px", overflowY: "auto" }}
      >
        <AnimatePresence>
          <div className="space-y-4">
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-[#86868B] text-center py-8">No hay mensajes aún</p>
            ) : (
              ticket.messages.map((msg, index) => {
                const isMe = msg.sender.id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={"flex " + (isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={"max-w-xs " + (isMe ? "items-end" : "items-start") + " flex flex-col gap-1"}>
                      {!isMe && (
                        <p className="text-xs text-[#86868B] px-1">{msg.sender.full_name}</p>
                      )}
                      <div className={"px-4 py-3 rounded-2xl text-sm leading-relaxed " + (isMe ? "bg-[#1D1D1F] text-white rounded-br-sm" : "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm")}>
                        {msg.message}
                      </div>
                      <p className="text-xs text-[#86868B] px-1">
                        {new Date(msg.created_at).toLocaleTimeString("es-HN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </AnimatePresence>
      </motion.div>

      {/* Input de mensaje */}
      {ticket.status !== "CLOSED" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={sendMessage}
          className="flex gap-3"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={sending || !message.trim()}
            className="bg-[#1D1D1F] text-white px-4 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </motion.button>
        </motion.form>
      )}

      {ticket.status === "CLOSED" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center"
        >
          <XCircle size={20} className="text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Ticket cerrado</p>
        </motion.div>
      )}
    </motion.div>
  );
}