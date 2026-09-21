"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
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

export default function TicketDetailPage() {
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

  if (loading) return <p className="text-[#86868B]">Cargando ticket...</p>;
  if (!ticket) return <p className="text-red-500">Ticket no encontrado</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/tickets" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-6 inline-block">
        ← Mis tickets
      </Link>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-[#86868B]">{ticket.ticket_number}</p>
            <h1 className="text-lg font-bold text-[#1D1D1F] mt-0.5">{ticket.subject}</h1>
            <p className="text-xs text-[#86868B] mt-0.5">{ticket.store?.business_name || "ARIX Plataforma"}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            ticket.status === "OPEN" ? "bg-blue-100 text-blue-700" :
            ticket.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" :
            ticket.status === "RESOLVED" ? "bg-green-100 text-green-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {ticket.messages.map((msg) => {
            const isMe = msg.sender.id === user?.id;
            return (
              <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
                <div className={"max-w-xs px-4 py-2.5 rounded-2xl text-sm " + (isMe ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
                  {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender.full_name}</p>}
                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Enviar mensaje */}
      {ticket.status !== "CLOSED" && (
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="bg-[#1D1D1F] text-white px-4 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
}