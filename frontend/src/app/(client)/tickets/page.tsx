"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, AlertCircle, CheckCircle, MessageSquare, Shield, Zap, HeadphonesIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import PageTransition from "@/components/shared/PageTransition";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  store: { business_name: string } | null;
  created_at: string;
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

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    store_id: "",
    priority: "MEDIUM",
  });
  const [stores, setStores] = useState<{ id: number; business_name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    api.get("/tickets?size=50")
      .then((res) => setTickets(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    api.get("/stores?size=50").then((res) => setStores(res.data.data.content));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/tickets", {
        subject: form.subject,
        description: form.description,
        store_id: form.store_id ? Number(form.store_id) : null,
        priority: form.priority,
      });
      setShowForm(false);
      setForm({ subject: "", description: "", store_id: "", priority: "MEDIUM" });
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Soporte</h1>
            <p className="text-[#86868B] mt-1">Gestiona tus tickets de soporte</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
          >
            <Plus size={16} />
            Nuevo ticket
          </motion.button>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Zap,
              title: "Respuesta rápida",
              desc: "Respondemos todos los tickets en menos de 24 horas hábiles. Los tickets de prioridad alta reciben atención inmediata.",
              stat: "< 24h",
              statLabel: "tiempo promedio",
            },
            {
              icon: Shield,
              title: "Privacidad garantizada",
              desc: "Tu conversación es completamente confidencial. Solo tú y el equipo de soporte asignado tienen acceso.",
              stat: "100%",
              statLabel: "confidencial",
            },
            {
              icon: HeadphonesIcon,
              title: "Soporte especializado",
              desc: "Nuestro equipo está capacitado para resolver cualquier problema relacionado con tus pedidos y experiencia de compra.",
              stat: "3",
              statLabel: "niveles de prioridad",
            },
          ].map(({ icon: Icon, title, desc, stat, statLabel }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center">
                  <Icon size={18} className="text-[#1D1D1F]" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#1D1D1F]">{stat}</p>
                  <p className="text-xs text-[#86868B]">{statLabel}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-[#1D1D1F] mb-1">{title}</p>
              <p className="text-xs text-[#86868B] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Resumen de tickets */}
        {tickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: "Abiertos", count: openCount, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "En progreso", count: inProgressCount, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Resueltos", count: resolvedCount, color: "text-green-600", bg: "bg-green-50" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={"rounded-2xl p-4 " + bg}>
                <p className={"text-2xl font-bold " + color}>{count}</p>
                <p className="text-xs text-[#86868B] mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Formulario */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4"
            >
              <h2 className="font-semibold text-[#1D1D1F]">Crear ticket de soporte</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-1.5">
                    Dirigido a
                  </label>
                  <select
                    value={form.store_id}
                    onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">ARIX Plataforma</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.business_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="LOW">Baja — consulta general</option>
                    <option value="MEDIUM">Media — necesito ayuda pronto</option>
                    <option value="HIGH">Alta — problema urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-1.5">
                  Asunto
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Describe brevemente tu problema"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe tu problema con el mayor detalle posible para que podamos ayudarte más rápido..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar ticket"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                className="bg-white rounded-2xl h-20 shadow-sm"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <MessageSquare size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#1D1D1F] font-medium">No tienes tickets de soporte</p>
            <p className="text-sm text-[#86868B] mt-1">
              Crea uno si tienes algún problema o consulta con tu pedido
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-[#1D1D1F] font-medium underline"
            >
              Crear mi primer ticket
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#86868B] uppercase tracking-widest mb-3">
              Mis tickets ({tickets.length})
            </p>
            {tickets.map((ticket, index) => {
              const statusInfo = statusConfig[ticket.status] || statusConfig.OPEN;
              const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    href={"/tickets/" + ticket.id}
                    className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all block group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={"p-2.5 rounded-xl " + statusInfo.color.split(" ")[0]}>
                        <StatusIcon size={16} className={statusInfo.color.split(" ")[1]} />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-[#86868B]">{ticket.ticket_number}</p>
                        <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5 group-hover:underline">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-[#86868B] mt-1">
                          {ticket.store?.business_name || "ARIX Plataforma"} ·{" "}
                          {new Date(ticket.created_at).toLocaleDateString("es-HN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + priorityInfo.color}>
                        {priorityInfo.label}
                      </span>
                      <span className={"px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 " + statusInfo.color}>
                        <StatusIcon size={10} />
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