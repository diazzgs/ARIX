"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Chat {
  id: number;
  other_user: { id: number; full_name: string; profile_image_url: string };
  store: { business_name: string } | null;
  last_message: string | null;
  unread_count: number;
  updated_at: string;
}

interface Message {
  id: number;
  content: string;
  sender: { id: number; full_name: string };
  is_read: boolean;
  created_at: string;
}

export default function ClientChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchChats = () => {
    api.get("/chats")
      .then((res) => setChats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    const res = await api.get("/chats/" + chat.id);
    setMessages(res.data.data.messages);
  };

  useEffect(() => { fetchChats(); }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedChat) return;
    setSending(true);
    try {
      const res = await api.post("/chats/" + selectedChat.id + "/messages", { content });
      setMessages(res.data.data.messages);
      setContent("");
      fetchChats();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-6">Chat</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex" style={{ height: "600px" }}>
        {/* Lista de conversaciones */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-[#1D1D1F]">Conversaciones</p>
          </div>
          {loading ? (
            <p className="text-sm text-[#86868B] p-4">Cargando...</p>
          ) : chats.length === 0 ? (
            <p className="text-sm text-[#86868B] p-4">No tienes conversaciones</p>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={"w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 " + (selectedChat?.id === chat.id ? "bg-gray-50" : "")}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-[#1D1D1F] truncate">{chat.other_user.full_name}</p>
                    {chat.unread_count > 0 && (
                      <span className="bg-[#1D1D1F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  {chat.store && <p className="text-xs text-[#86868B]">{chat.store.business_name}</p>}
                  {chat.last_message && (
                    <p className="text-xs text-[#86868B] truncate mt-0.5">{chat.last_message}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-[#1D1D1F]">{selectedChat.other_user.full_name}</p>
                {selectedChat.store && <p className="text-xs text-[#86868B]">{selectedChat.store.business_name}</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender.id === user?.id;
                  return (
                    <div key={msg.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
                      <div className={"max-w-xs px-4 py-2.5 rounded-2xl text-sm " + (isMe ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
                        <p>{msg.content}</p>
                        <p className={"text-xs mt-1 " + (isMe ? "text-gray-400" : "text-[#86868B]")}>
                          {new Date(msg.created_at).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#86868B]">Selecciona una conversación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}