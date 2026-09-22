"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer: { full_name: string };
  updated_at: string;
  messages: { id: number }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Abierto", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "En progreso", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  RESOLVED: { label: "Resuelto", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "Cerrado", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string; desc: string }> = {
  LOW: { label: "Baja", color: "bg-gray-100 text-gray-600", desc: "Sin urgencia" },
  MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700", desc: "Atender pronto" },
  HIGH: { label: "Alta", color: "bg-red-100 text-red-700", desc: "Urgente" },
};

export default function StoreTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get("/store/tickets?size=50")
      .then((res) => setTickets(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    RESOLVED: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <PageTransition>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Tickets de soporte</h1>
          <p className="text-[#86868B] mt-1">Tickets de clientes dirigidos a tu tienda</p>
        </div>

        {/* Leyenda de prioridades */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <p className="text-xs font-medium text-[#86868B] uppercase tracking-widest mb-3">
            Niveles de prioridad
          </p>
          <div className="flex gap-4">
            {Object.entries(priorityConfig).map(([key, { label, color, desc }]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + color}>
                  {label}
                </span>
                <span className="text-xs text-[#86868B]">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "ALL", label: "Todos" },
            { key: "OPEN", label: "Abiertos" },
            { key: "IN_PROGRESS", label: "En progreso" },
            { key: "RESOLVED", label: "Resueltos" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={"px-4 py-2 rounded-xl text-sm font-medium transition-colors " + (filter === key ? "bg-[#1D1D1F] text-white" : "bg-white text-[#86868B] hover:bg-gray-50 shadow-sm")}
            >
              {label}
              <span className={"ml-2 text-xs " + (filter === key ? "opacity-70" : "")}>
                {counts[key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[#86868B]">Cargando tickets...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#86868B]">No hay tickets en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket, index) => {
              const statusInfo = statusConfig[ticket.status] || statusConfig.OPEN;
              const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link
                    href={"/store/tickets/" + ticket.id}
                    className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all block group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={"p-2.5 rounded-xl " + statusInfo.color.replace("text-", "bg-").split(" ")[0] + " bg-opacity-50"}>
                        <StatusIcon size={16} className={statusInfo.color.split(" ")[1]} />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-[#86868B]">{ticket.ticket_number}</p>
                        <p className="text-sm font-medium text-[#1D1D1F] mt-0.5 group-hover:underline">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-[#86868B] mt-1">
                          {ticket.customer.full_name} · {new Date(ticket.updated_at).toLocaleDateString("es-HN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + priorityInfo.color}>
                        {priorityInfo.label}
                      </span>
                      <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + statusInfo.color}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}