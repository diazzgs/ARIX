"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
  status: string;
  priority: string;
  store: { business_name: string } | null;
  messages: Message[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Abierto", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "En progreso", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  RESOLVED: { label: "Resuelto", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "Cerrado", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "Alta", color: "bg-red-100 text-red-700" },
};

export default function ClientTicketDetailPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
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
      {/* Breadcrumb */}
      <Link
        href="/tickets"
        className="flex items-center gap-1 text-[#86868B] hover:text-[#1D1D1F] text-sm transition-colors mb-6 inline-flex"
      >
        ← Mis tickets
      </Link>

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
              {ticket.store && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#86868B]">
                  {ticket.store.business_name}
                </span>
              )}
            </div>
          </div>
        </div>
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
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-[#86868B] text-sm">No hay mensajes aún</p>
                <p className="text-xs text-[#86868B] mt-1">Escribe un mensaje para iniciar la conversación</p>
              </div>
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
                    <div className={"max-w-xs flex flex-col gap-1 " + (isMe ? "items-end" : "items-start")}>
                      {!isMe && (
                        <p className="text-xs text-[#86868B] px-1 font-medium">
                          {msg.sender.full_name}
                        </p>
                      )}
                      <div className={"px-4 py-3 rounded-2xl text-sm leading-relaxed " + (isMe ? "bg-[#1D1D1F] text-white rounded-br-sm" : "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm")}>
                        {msg.message}
                      </div>
                      <p className="text-xs text-[#86868B] px-1">
                        {new Date(msg.created_at).toLocaleDateString("es-HN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
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

      {/* Input o estado resuelto */}
      {ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center"
        >
          <CheckCircle size={20} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">Ticket resuelto</p>
          <p className="text-xs text-green-600 mt-0.5">
            Este ticket ha sido marcado como resuelto por el equipo de soporte
          </p>
        </motion.div>
      ) : (
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
            placeholder="Escribe tu mensaje..."
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
    </motion.div>
  );
}