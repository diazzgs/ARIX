"use client";

import { useEffect, useState } from "react";
import { ScrollText, Receipt, Download } from "lucide-react";
import api from "@/lib/api";

interface AuditItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  user: { full_name: string; email: string } | null;
  ip_address: string | null;
  created_at: string;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  order_number: string;
  store_name: string | null;
  customer_name: string;
  type: string;
  total: number;
  issued_at: string;
}

const ACTION_OPTIONS = [
  "ADMIN_CREATED",
  "STORE_CREATED",
  "STORE_UPDATED",
  "STORE_STATUS_CHANGED",
  "STORE_LOGO_CHANGED",
  "STORE_DELETED",
  "STORE_ORDER_STATUS_CHANGED",
  "TICKET_ASSIGNED",
  "USER_STATUS_CHANGED",
];

const ENTITY_OPTIONS = ["STORE", "STORE_ORDER", "TICKET", "USER"];

const money = (n: number) => "L. " + Number(n).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminAuditPage() {
  const [tab, setTab] = useState<"audit" | "invoices">("audit");

  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingLogs(true);
      const params = new URLSearchParams({ size: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity_type", entityFilter);

      api.get("/admin/audit-logs?" + params.toString())
        .then((res) => setLogs(res.data.data.content))
        .catch(console.error)
        .finally(() => setLoadingLogs(false));
    }, 0);

    return () => clearTimeout(timeout);
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    if (tab !== "invoices" || invoices.length > 0) return;

    const timeout = setTimeout(() => {
      setLoadingInvoices(true);
      api.get("/admin/invoices?size=50")
        .then((res) => setInvoices(res.data.data.content))
        .catch(console.error)
        .finally(() => setLoadingInvoices(false));
    }, 0);

    return () => clearTimeout(timeout);
  }, [tab, invoices.length]);

  const downloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const res = await api.get("/admin/invoices/" + invoiceId + "/download", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = invoiceNumber + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Auditoría</h1>
        <p className="text-[#86868B] mt-1">Historial de acciones administrativas y facturación de la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("audit")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors " + (tab === "audit" ? "bg-[#1D1D1F] text-white" : "bg-white text-[#86868B] hover:text-[#1D1D1F] shadow-sm")}
        >
          <ScrollText size={15} />
          Registro de auditoría
        </button>
        <button
          onClick={() => setTab("invoices")}
          className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors " + (tab === "invoices" ? "bg-[#1D1D1F] text-white" : "bg-white text-[#86868B] hover:text-[#1D1D1F] shadow-sm")}
        >
          <Receipt size={15} />
          Facturas
        </button>
      </div>

      {tab === "audit" ? (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">Todas las acciones</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">Todas las entidades</option>
              {ENTITY_OPTIONS.map((en) => (
                <option key={en} value={en}>{en}</option>
              ))}
            </select>
            {(actionFilter || entityFilter) && (
              <button
                onClick={() => { setActionFilter(""); setEntityFilter(""); }}
                className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {loadingLogs ? (
            <p className="text-[#86868B]">Cargando logs...</p>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-[#86868B]">No se encontraron registros con esos filtros</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Acción</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Entidad</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Ejecutado por</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">IP</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F] font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1D1D1F]">{log.entity_type} #{log.entity_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1D1D1F]">{log.user?.full_name || "Sistema"}</p>
                        <p className="text-xs text-[#86868B]">{log.user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#86868B] font-mono">{log.ip_address || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#86868B]">
                          {new Date(log.created_at).toLocaleString("es-HN")}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : loadingInvoices ? (
        <p className="text-[#86868B]">Cargando facturas...</p>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-[#86868B]">Todavía no hay facturas generadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Factura</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Orden</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Tienda</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Total</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#86868B]">Fecha</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-[#1D1D1F]">{inv.invoice_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#86868B] font-mono">{inv.order_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={"px-2.5 py-1 rounded-full text-xs font-medium " + (inv.store_name ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                      {inv.store_name || "Consolidada"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1D1D1F]">{inv.customer_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">{money(inv.total)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#86868B]">{new Date(inv.issued_at).toLocaleString("es-HN")}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadInvoice(inv.id, inv.invoice_number)}
                      title="Descargar PDF"
                      className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-gray-100 transition-colors"
                    >
                      <Download size={15} />
                    </button>
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