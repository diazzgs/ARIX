"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import api from "@/lib/api";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  store: { business_name: string } | null;
  created_at: string;
}

const statusColor = (s: string) => {
  if (s === "OPEN") return "bg-blue-100 text-blue-700";
  if (s === "IN_PROGRESS") return "bg-yellow-100 text-yellow-700";
  if (s === "RESOLVED") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
};

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", store_id: "" });
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
        priority: "MEDIUM",
      });
      setShowForm(false);
      setForm({ subject: "", description: "", store_id: "" });
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">Soporte</h1>
          <p className="text-[#86868B] mt-1">Gestiona tus tickets de soporte</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Nuevo ticket
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-medium text-[#1D1D1F]">Crear ticket de soporte</h2>
          <select
            value={form.store_id}
            onChange={(e) => setForm({ ...form, store_id: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Dirigido a la plataforma (ARIX)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.business_name}</option>
            ))}
          </select>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Asunto"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe tu problema o consulta..."
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#1D1D1F] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar ticket"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl border border-gray-200 text-sm text-[#86868B] hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-[#86868B]">Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No tienes tickets de soporte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={"/tickets/" + ticket.id}
              className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow block"
            >
              <div>
                <p className="text-sm font-mono text-[#86868B]">{ticket.ticket_number}</p>
                <p className="text-sm font-medium text-[#1D1D1F] mt-0.5">{ticket.subject}</p>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {ticket.store?.business_name || "ARIX Plataforma"}
                </p>
              </div>
              <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + statusColor(ticket.status)}>
                {ticket.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}