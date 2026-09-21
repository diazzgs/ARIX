"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  customer: { full_name: string };
  updated_at: string;
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

export default function StoreTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/store/tickets?size=50")
      .then((res) => setTickets(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Tickets de soporte</h1>
        <p className="text-[#86868B] mt-1">Tickets de clientes dirigidos a tu tienda</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">No hay tickets de soporte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={"/store/tickets/" + ticket.id}
              className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow block"
            >
              <div>
                <p className="text-xs font-mono text-[#86868B]">{ticket.ticket_number}</p>
                <p className="text-sm font-medium text-[#1D1D1F] mt-0.5">{ticket.subject}</p>
                <p className="text-xs text-[#86868B] mt-0.5">Cliente: {ticket.customer.full_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + priorityColor(ticket.priority)}>
                  {ticket.priority}
                </span>
                <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + statusColor(ticket.status)}>
                  {ticket.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}