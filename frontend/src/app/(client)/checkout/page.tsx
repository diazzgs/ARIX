"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, clearCart } = useCartStore();
  const [address, setAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [cardDigits, setCardDigits] = useState("");
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

  const handleCheckout = async () => {
    if (!address) { setError("Ingresa tu dirección de envío"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/orders/checkout", {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        payment_method: paymentMethod,
        card_last_digits: cardDigits || null,
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
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-8">Checkout</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
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
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="font-medium text-[#1D1D1F] mb-4">Dirección de envío</h2>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Col. Palmira, Tegucigalpa, Honduras"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="font-medium text-[#1D1D1F] mb-4">Método de pago</h2>
        <div className="space-y-3">
          {["CREDIT_CARD", "DEBIT_CARD"].map((method) => (
            <label key={method} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="accent-black"
              />
              <span className="text-sm text-[#1D1D1F]">
                {method === "CREDIT_CARD" ? "Tarjeta de crédito" : "Tarjeta de débito"}
              </span>
            </label>
          ))}
        </div>
        <input
          type="text"
          maxLength={4}
          value={cardDigits}
          onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, ""))}
          placeholder="Últimos 4 dígitos de la tarjeta"
          className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#1D1D1F] text-white py-4 rounded-2xl font-medium hover:bg-black transition-colors disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Confirmar compra — L. " + grandTotal.toFixed(2)}
      </button>
    </div>
  );
}