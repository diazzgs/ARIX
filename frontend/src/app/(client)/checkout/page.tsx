"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, MapPin, Lock, User, Calendar, AlertCircle, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

const formatCardNumber = (digits: string) => digits.replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (digits: string) => (digits.length <= 2 ? digits : digits.slice(0, 2) + "/" + digits.slice(2, 4));

const detectBrand = (digits: string) => {
  if (digits.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  return "";
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, clearCart } = useCartStore();
  const [address, setAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [cardNumber, setCardNumber] = useState(""); // solo dígitos, máx 16
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState(""); // solo dígitos, MMYY, máx 4
  const [cvv, setCvv] = useState("");
  const [cvvFocused, setCvvFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tax = total() * 0.15;
  const grandTotal = total() + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl text-center py-16">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-xl font-bold text-[#1D1D1F] mb-2">Tu carrito está vacío</h1>
        <p className="text-[#86868B] mb-6">Agrega productos desde el catálogo</p>
        <Link
          href="/catalog"
          className="inline-block bg-[#1D1D1F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const brand = detectBrand(cardNumber);

  const isCardNumberValid = cardNumber.length === 16;
  const isNameValid = cardName.trim().length >= 3;

  const expiryMonth = parseInt(expiry.slice(0, 2), 10);
  const expiryYear = 2000 + parseInt(expiry.slice(2, 4), 10);
  const isExpiryFormatValid = expiry.length === 4 && expiryMonth >= 1 && expiryMonth <= 12;
  const isExpiryExpired = isExpiryFormatValid && new Date(expiryYear, expiryMonth) <= new Date();

  const isCvvValid = cvv.length === 3 || cvv.length === 4;

  const getCardError = () => {
    if (!isCardNumberValid) return "El número de tarjeta debe tener los 16 dígitos";
    if (!isNameValid) return "Ingresa el nombre del titular de la tarjeta";
    if (!isExpiryFormatValid) return "Ingresa una fecha de vencimiento válida (MM/AA)";
    if (isExpiryExpired) return "La tarjeta está vencida";
    if (!isCvvValid) return "El CVV debe tener 3 o 4 dígitos";
    return null;
  };

  const handleCheckout = async () => {
    if (!address) { setError("Ingresa tu dirección de envío"); return; }
    const cardError = getCardError();
    if (cardError) { setError(cardError); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/orders/checkout", {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        payment_method: paymentMethod,
        card_last_digits: cardNumber.slice(-4),
      });
      clearCart();
      router.push("/orders/" + res.data.data.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-[#1D1D1F] mb-8"
      >
        Checkout
      </motion.h1>

      {/* Resumen del pedido */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm mb-4"
      >
        <h2 className="font-medium text-[#1D1D1F] mb-4">Resumen del pedido</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#1D1D1F]">{item.name}</p>
                <p className="text-xs text-[#86868B]">{item.store_name} · x{item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-[#1D1D1F]">
                {"L. " + (item.price * item.quantity).toLocaleString("es-HN")}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-[#86868B]">
            <span>Subtotal</span>
            <span>{"L. " + total().toLocaleString("es-HN")}</span>
          </div>
          <div className="flex justify-between text-sm text-[#86868B]">
            <span>Impuestos (15%)</span>
            <span>{"L. " + tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-[#1D1D1F]">
            <span>Total</span>
            <span>{"L. " + grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>

      {/* Dirección de envío */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-6 shadow-sm mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-[#86868B]" />
          <h2 className="font-medium text-[#1D1D1F]">Dirección de envío</h2>
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Col. Palmira, Tegucigalpa, Honduras"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </motion.div>

      {/* Método de pago */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-[#86868B]" />
          <h2 className="font-medium text-[#1D1D1F]">Método de pago</h2>
        </div>

        <div className="flex gap-3 mb-5">
          {["CREDIT_CARD", "DEBIT_CARD"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors " +
                (paymentMethod === method
                  ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                  : "border-gray-200 text-[#86868B] hover:border-gray-300")
              }
            >
              {method === "CREDIT_CARD" ? "Tarjeta de crédito" : "Tarjeta de débito"}
            </button>
          ))}
        </div>

        {/* Tarjeta visual */}
        <div className="mb-5" style={{ perspective: 1000 }}>
          <motion.div
            animate={{ rotateY: cvvFocused ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full h-44 sm:h-40"
          >
            {/* Frente */}
            <div
              style={{ backfaceVisibility: "hidden" }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2C2C2E] via-[#1D1D1F] to-black p-5 flex flex-col justify-between text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90" />
                <span className="text-xs font-bold tracking-widest opacity-80">
                  {brand || (paymentMethod === "CREDIT_CARD" ? "CRÉDITO" : "DÉBITO")}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-mono tracking-widest">
                {formatCardNumber(cardNumber) || "•••• •••• •••• ••••"}
              </p>
              <div className="flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="opacity-60 mb-0.5">TITULAR</p>
                  <p className="font-medium tracking-wide uppercase truncate max-w-[160px]">
                    {cardName || "NOMBRE APELLIDO"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="opacity-60 mb-0.5">VENCE</p>
                  <p className="font-medium">{formatExpiry(expiry) || "MM/AA"}</p>
                </div>
              </div>
            </div>
            {/* Reverso (CVV) */}
            <div
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2C2C2E] via-[#1D1D1F] to-black shadow-lg text-white overflow-hidden"
            >
              <div className="w-full h-9 bg-black mt-5" />
              <div className="px-5 mt-5">
                <p className="text-xs opacity-60 mb-1">CVV</p>
                <div className="bg-white/90 rounded-md h-8 flex items-center justify-end px-3">
                  <span className="text-[#1D1D1F] font-mono tracking-widest text-sm">{cvv || "•••"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
              Número de tarjeta
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                inputMode="numeric"
                value={formatCardNumber(cardNumber)}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="0000 0000 0000 0000"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
              Nombre del titular
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase().slice(0, 40))}
                placeholder="Como aparece en la tarjeta"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                Vencimiento
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatExpiry(expiry)}
                  onChange={(e) => setExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="MM/AA"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-1.5">
                CVV
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                <input
                  type="password"
                  inputMode="numeric"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onFocus={() => setCvvFocused(true)}
                  onBlur={() => setCvvFocused(false)}
                  placeholder="•••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono tracking-widest"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-[#86868B] mt-4">
          <ShieldCheck size={13} className="shrink-0" />
          Esta es una simulación de pago; no se realiza ningún cargo real.
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4"
          >
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#1D1D1F] text-white py-4 rounded-2xl font-medium hover:bg-black transition-colors disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Confirmar compra — L. " + grandTotal.toFixed(2)}
      </motion.button>
    </div>
  );
}