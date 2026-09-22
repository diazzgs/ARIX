"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, visible, onClose }: ToastProps) {
  const isError = message.startsWith("Error");

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1D1D1F] text-white px-5 py-3.5 rounded-2xl shadow-xl"
        >
          {isError ? (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-green-400 shrink-0" />
          )}
          <p className="text-sm font-medium">{message}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}