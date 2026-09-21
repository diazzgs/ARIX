"use client";

import { useEffect, useState } from "react";
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

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/audit-logs?size=50")
      .then((res) => setLogs(res.data.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Auditoría</h1>
        <p className="text-[#86868B] mt-1">Historial de acciones administrativas</p>
      </div>

      {loading ? (
        <p className="text-[#86868B]">Cargando logs...</p>
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
    </div>
  );
}