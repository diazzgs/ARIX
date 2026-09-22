"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface TicketItem {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer: { full_name: string };
  store: { business_name: string } | null;
  created_at: string;
}

const statusColor = (s: string) => {
  if (s === "OPEN") return "bg-blue-100 text-blue-700";
  if (s === "IN_PROGRESS") return "bg-yellow-100 text-yellow-700";
  if (s === "RESOLVED") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
};

const priorityColor = (p: string) => {
  if (p === "HIGH") return "bg-red-100 text-red-700";
  if (p === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/tickets?size=50")
      .then((res) => setTickets(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Tickets de soporte</h1>
        <p className="text-[#86868B] mt-1">Supervisa todos los tickets de la plataforma</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No hay tickets registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]"># Ticket</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Asunto</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Tienda</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Prioridad</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => router.push("/admin/tickets/" + ticket.id)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <Link href={"/admin/tickets/" + ticket.id} className="text-sm font-mono text-[#1D1D1F] hover:underline">
                      {ticket.ticket_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1D1D1F]">{ticket.subject}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1D1D1F]">{ticket.customer.full_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#86868B]">{ticket.store?.business_name || "Plataforma"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={16} className="text-[#86868B] inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}