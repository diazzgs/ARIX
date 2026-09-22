"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Plus, X, Search } from "lucide-react";
import api from "@/lib/api";

interface Chat {
  id: number;
  other_user: { id: number; full_name: string };
  store: { id: number; business_name: string } | null;
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

interface Store {
  id: number;
  business_name: string;
  slug: string;
}

export default function ClientChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [starting, setStarting] = useState(false);
  const [searchStore, setSearchStore] = useState("");

  const fetchChats = async () => {
    const res = await api.get("/chats").catch(console.error);
    if (res) setChats(res.data.data);
    setLoading(false);
  };

  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    const res = await api.get("/chats/" + chat.id);
    setMessages(res.data.data.messages);
  };

  useEffect(() => {
    fetchChats();
    api.get("/stores?size=100")
      .then((res) => setStores(res.data.data.content))
      .catch(console.error);
  }, []);

  const startNewChat = async (store: Store) => {
    setStarting(true);
    try {
      // Obtener el admin de la tienda por su slug
      const storeRes = await api.get("/stores/" + store.slug);
      const adminId = storeRes.data.data.admin.id;

      const res = await api.post("/chats", {
        other_user_id: adminId,
        store_id: store.id,
      });

      setShowNewChat(false);
      setSearchStore("");
      await fetchChats();

      const chatId = res.data.data.id;
      const chatRes = await api.get("/chats/" + chatId);
      setSelectedChat(res.data.data);
      setMessages(chatRes.data.data.messages || []);
    } catch (err) {
      console.error(err);
      setShowNewChat(false);
      setSearchStore("");
      await fetchChats();
    } finally {
      setStarting(false);
    }
  };

  const closeModal = () => {
    setShowNewChat(false);
    setSearchStore("");
  };

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

  const filteredStores = stores.filter((s) =>
    s.business_name.toLowerCase().includes(searchStore.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Chat</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewChat(true)}
          className="flex items-center gap-2 bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Nueva conversación
        </motion.button>
      </div>

      {/* Modal nueva conversación */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1D1D1F]">Nueva conversación</h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-[#86868B] hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  value={searchStore}
                  onChange={(e) => setSearchStore(e.target.value)}
                  placeholder="Buscar tienda..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
              </div>

              {/* Lista de tiendas */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredStores.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-[#86868B]">No se encontraron tiendas</p>
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <motion.button
                      key={store.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => startNewChat(store)}
                      disabled={starting}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F5F5F7] rounded-lg flex items-center justify-center text-sm">
                          🏪
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1D1D1F]">{store.business_name}</p>
                          <p className="text-xs text-[#86868B]">Iniciar conversación</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>

              {starting && (
                <p className="text-xs text-[#86868B] text-center mt-3">Iniciando conversación...</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="bg-white rounded-2xl shadow-sm overflow-hidden flex"
        style={{ height: "560px" }}
      >
        {/* Lista de conversaciones */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-[#1D1D1F]">Conversaciones</p>
          </div>
          {loading ? (
            <p className="text-sm text-[#86868B] p-4">Cargando...</p>
          ) : chats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <MessageCircle size={28} className="text-gray-300" />
              <p className="text-sm text-[#86868B]">No tienes conversaciones</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="text-xs text-[#1D1D1F] font-medium underline"
              >
                Iniciar una
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat, index) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => openChat(chat)}
                  className={"w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 " + (selectedChat?.id === chat.id ? "bg-[#F5F5F7]" : "")}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-[#1D1D1F] truncate">
                      {chat.other_user.full_name}
                    </p>
                    {chat.unread_count > 0 && (
                      <span className="bg-[#1D1D1F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  {chat.store && (
                    <p className="text-xs text-[#86868B]">{chat.store.business_name}</p>
                  )}
                  {chat.last_message && (
                    <p className="text-xs text-[#86868B] truncate mt-0.5">{chat.last_message}</p>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-[#1D1D1F]">
                  {selectedChat.other_user.full_name}
                </p>
                {selectedChat.store && (
                  <p className="text-xs text-[#86868B]">{selectedChat.store.business_name}</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <AnimatePresence>
                  {messages.map((msg, index) => {
                    const isMe = msg.sender.id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={"flex " + (isMe ? "justify-end" : "justify-start")}
                      >
                        <div className={"max-w-xs flex flex-col gap-1 " + (isMe ? "items-end" : "items-start")}>
                          {!isMe && (
                            <p className="text-xs text-[#86868B] px-1 font-medium">
                              {msg.sender.full_name}
                            </p>
                          )}
                          <div className={"px-4 py-2.5 rounded-2xl text-sm " + (isMe ? "bg-[#1D1D1F] text-white rounded-br-sm" : "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm")}>
                            {msg.content}
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
                  })}
                </AnimatePresence>
              </div>
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="bg-[#1D1D1F] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                  Enviar
                </motion.button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageCircle size={32} className="text-gray-300" />
              <p className="text-sm text-[#86868B]">Selecciona una conversación</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="text-sm text-[#1D1D1F] font-medium underline"
              >
                o inicia una nueva
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}