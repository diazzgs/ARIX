"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Warehouse, Ticket } from "lucide-react";
import PageTransition from "@/components/shared/PageTransition";
import api from "@/lib/api";

interface StoreData {
  business_name: string;
  status: string;
}

export default function StoreDashboardPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState(0);
  const [orders, setOrders] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, productsRes, ordersRes, lowStockRes, ticketsRes] = await Promise.all([
          api.get("/store/me"),
          api.get("/store/products?size=1"),
          api.get("/store/orders?size=1"),
          api.get("/store/inventory/low-stock"),
          api.get("/store/tickets?size=1"),
        ]);
        setStore(storeRes.data.data);
        setProducts(productsRes.data.data.total_elements);
        setOrders(ordersRes.data.data.total_elements);
        setLowStock(lowStockRes.data.data.length);
        setTickets(ticketsRes.data.data.total_elements);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { label: "Productos", value: products, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Pedidos", value: orders, icon: ShoppingBag, color: "bg-green-50 text-green-600" },
    { label: "Stock bajo", value: lowStock, icon: Warehouse, color: "bg-red-50 text-red-600" },
    { label: "Tickets abiertos", value: tickets, icon: Ticket, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <PageTransition>
    <div>
      <h1 className="text-2xl font-bold text-[#1D1D1F]">
        {store ? store.business_name : "Dashboard"}
      </h1>
      <p className="text-[#86868B] mt-1 mb-8">Panel de administración de tu tienda</p>

      {loading ? (
        <p className="text-[#86868B]">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold text-[#1D1D1F]">{value}</p>
              <p className="text-sm text-[#86868B] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}