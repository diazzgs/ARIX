"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface StoreOrder {
  id: number;
  sub_order_number: string;
  store: { business_name: string };
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  items: OrderItem[];
}

interface OrderDetail {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  store_orders: StoreOrder[];
  payment: { status: string; card_last_digits: string | null } | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  type: string;
  total: number;
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/orders/" + orderId),
      api.get("/orders/" + orderId + "/invoices"),
    ])
      .then(([orderRes, invRes]) => {
        setOrder(orderRes.data.data);
        setInvoices(invRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <p className="text-[#86868B] p-8">Cargando orden...</p>;
  if (!order) return <p className="text-red-500 p-8">Orden no encontrada</p>;

  return (
    <div className="max-w-3xl">
      <Link href="/orders" className="text-[#86868B] hover:text-[#1D1D1F] text-sm mb-8 inline-block">
        ← Mis órdenes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">{order.order_number}</h1>
          <p className="text-[#86868B] text-sm mt-1">
            {new Date(order.created_at).toLocaleString("es-HN")}
          </p>
        </div>
        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {order.status}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="font-medium text-[#1D1D1F] mb-3">Información de entrega</h2>
        <p className="text-sm text-[#86868B]">{order.shipping_address}</p>
        <p className="text-sm text-[#86868B] mt-1">
          Pago: {order.payment_method}
          {order.payment?.card_last_digits ? " **** " + order.payment.card_last_digits : ""}
        </p>
      </div>

      {order.store_orders.map((so) => (
        <div key={so.id} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[#1D1D1F]">{so.store.business_name}</h2>
            <span className="text-xs font-mono text-[#86868B]">{so.sub_order_number}</span>
          </div>
          <div className="space-y-3">
            {so.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#1D1D1F]">{item.product_name}</p>
                  <p className="text-xs text-[#86868B]">
                    {"x" + item.quantity + " × L. " + Number(item.unit_price).toLocaleString("es-HN")}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#1D1D1F]">
                  {"L. " + Number(item.line_total).toLocaleString("es-HN")}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm text-[#86868B]">
              <span>Subtotal</span>
              <span>{"L. " + Number(so.subtotal).toLocaleString("es-HN")}</span>
            </div>
            <div className="flex justify-between text-sm text-[#86868B]">
              <span>Impuestos (15%)</span>
              <span>{"L. " + Number(so.tax_amount).toLocaleString("es-HN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#1D1D1F]">
              <span>Total</span>
              <span>{"L. " + Number(so.total).toLocaleString("es-HN")}</span>
            </div>
          </div>
        </div>
      ))}

      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-medium text-[#1D1D1F] mb-4">Facturas</h2>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-[#1D1D1F]">{inv.invoice_number}</p>
                  <p className="text-xs text-[#86868B]">{inv.type}</p>
                </div>
                
                  <a href={"http://localhost:8080/api/invoices/" + inv.id + "/download"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1D1D1F] font-medium hover:underline"
                >
                  Descargar PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}