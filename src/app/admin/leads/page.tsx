"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/lib/hooks";

interface Lead {
  id: string;
  name: string;
  email: string;
  score: number;
  profile: string | null;
  badge: string | null;
  project: string | null;
  createdAt: string;
}

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pages: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

function BadgePill({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(212,168,80,0.12)] text-[#d4a850] border border-[rgba(212,168,80,0.25)]">
      {text}
    </span>
  );
}

export default function LeadsPage() {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const fetchLeads = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (projectId) params.set("projectId", projectId);
    if (debouncedSearch) params.set("search", debouncedSearch);

    setLoading(true);
    fetch(`/api/admin/leads?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [page, projectId, debouncedSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []));
  }, []);

  function exportCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (projectId) params.set("projectId", projectId);
    if (debouncedSearch) params.set("search", debouncedSearch);
    window.open(`/api/admin/leads?${params}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-[#f5e8c8] text-2xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Leads
          {data && (
            <span className="ml-3 text-base text-[rgba(245,232,200,0.3)] font-normal">
              {data.total} total
            </span>
          )}
        </h1>
        <button
          onClick={exportCsv}
          className="px-4 py-2 text-sm border border-[rgba(212,168,80,0.3)] text-[rgba(212,168,80,0.7)] rounded-lg hover:border-[#d4a850] hover:text-[#d4a850] transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por e-mail..."
          className="flex-1 max-w-xs px-3 py-2 text-sm bg-[#1a1006] border border-[rgba(212,168,80,0.2)] text-[rgba(245,232,200,0.7)] placeholder-[rgba(245,232,200,0.2)] rounded-lg outline-none focus:border-[rgba(212,168,80,0.5)] transition-colors"
        />
        {projects.length > 1 && (
          <select
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
            className="bg-[#1a1006] border border-[rgba(212,168,80,0.2)] text-[rgba(245,232,200,0.7)] text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#1a1006] border border-[rgba(212,168,80,0.12)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[rgba(212,168,80,0.08)]">
              {["Nome", "E-mail", "Score", "Perfil", "Projeto", "Data"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[rgba(245,232,200,0.3)] text-xs uppercase tracking-widest font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[rgba(245,232,200,0.2)] text-sm">
                  Carregando...
                </td>
              </tr>
            ) : data?.leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[rgba(245,232,200,0.2)] text-sm">
                  Nenhum lead encontrado.
                </td>
              </tr>
            ) : (
              data?.leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[rgba(212,168,80,0.05)] hover:bg-[rgba(212,168,80,0.03)] transition-colors"
                >
                  <td className="px-4 py-3 text-[rgba(245,232,200,0.8)]">{lead.name}</td>
                  <td className="px-4 py-3 text-[rgba(245,232,200,0.6)] font-mono text-xs">{lead.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[#d4a850] font-semibold">{lead.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <BadgePill text={lead.badge} />
                  </td>
                  <td className="px-4 py-3 text-[rgba(245,232,200,0.4)] text-xs">{lead.project}</td>
                  <td className="px-4 py-3 text-[rgba(245,232,200,0.3)] text-xs">
                    {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[rgba(245,232,200,0.3)] text-xs">
            Página {data.page} de {data.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-[rgba(212,168,80,0.2)] text-[rgba(212,168,80,0.6)] rounded-lg disabled:opacity-30 hover:border-[rgba(212,168,80,0.5)] transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="px-3 py-1.5 text-xs border border-[rgba(212,168,80,0.2)] text-[rgba(212,168,80,0.6)] rounded-lg disabled:opacity-30 hover:border-[rgba(212,168,80,0.5)] transition-colors"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
