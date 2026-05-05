"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Metrics {
  leadsToday: number;
  leads7d: number;
  leads30d: number;
  pageViews7d: number;
  ctaClicks7d: number;
  conversionRate: number;
  funnel: { event: string; sessions: number }[];
  profileDistribution: { profileId: string; count: number }[];
  scoreDistribution: { bucket: string; count: number }[];
  projects: { id: string; name: string; slug: string }[];
}

const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Visitantes",
  quiz_start: "Iniciaram",
  quiz_complete: "Completaram",
  lead_capture: "Leads",
  cta_click: "Clicaram CTA",
};

const GOLD = "#d4a850";
const GOLD_DIM = "rgba(212,168,80,0.3)";
const PIE_COLORS = ["#d4a850", "#e0b86a", "#b8893a", "#8b6420"];

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[#1a1006] border border-[rgba(212,168,80,0.12)] rounded-xl p-5">
      <div className="text-[rgba(245,232,200,0.35)] text-xs uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="text-[#d4a850] text-3xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[rgba(245,232,200,0.3)] text-xs mt-1">{sub}</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = projectId
      ? `/api/admin/metrics?projectId=${projectId}`
      : "/api/admin/metrics";
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setMetrics(d);
        setLoading(false);
      });
  }, [projectId]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[rgba(245,232,200,0.3)] text-sm">Carregando...</div>
      </div>
    );
  }

  const funnelData = metrics.funnel.map((f) => ({
    name: FUNNEL_LABELS[f.event] ?? f.event,
    value: f.sessions,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1
          className="text-[#f5e8c8] text-2xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Dashboard
        </h1>
        {metrics.projects.length > 1 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-[#1a1006] border border-[rgba(212,168,80,0.2)] text-[rgba(245,232,200,0.7)] text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="">Todos os projetos</option>
            {metrics.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Leads hoje" value={metrics.leadsToday} />
        <MetricCard label="Leads 7 dias" value={metrics.leads7d} />
        <MetricCard label="Leads 30 dias" value={metrics.leads30d} />
        <MetricCard label="Pageviews 7d" value={metrics.pageViews7d} />
        <MetricCard label="Cliques CTA 7d" value={metrics.ctaClicks7d} />
        <MetricCard
          label="Taxa conversão"
          value={`${metrics.conversionRate}%`}
          sub="pageview → CTA (7d)"
        />
      </div>

      {/* Funnel */}
      <div className="bg-[#1a1006] border border-[rgba(212,168,80,0.12)] rounded-xl p-6">
        <h2 className="text-[rgba(245,232,200,0.5)] text-xs uppercase tracking-widest mb-6">
          Funil (últimos 30 dias)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={funnelData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(245,232,200,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(245,232,200,0.3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1006",
                border: "0.5px solid rgba(212,168,80,0.3)",
                borderRadius: 8,
                color: "#f5e8c8",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1006] border border-[rgba(212,168,80,0.12)] rounded-xl p-6">
          <h2 className="text-[rgba(245,232,200,0.5)] text-xs uppercase tracking-widest mb-6">
            Distribuição de scores (30d)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.scoreDistribution} barCategoryGap="30%">
              <XAxis
                dataKey="bucket"
                tick={{ fill: "rgba(245,232,200,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(245,232,200,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1006",
                  border: "0.5px solid rgba(212,168,80,0.3)",
                  borderRadius: 8,
                  color: "#f5e8c8",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill={GOLD_DIM} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1006] border border-[rgba(212,168,80,0.12)] rounded-xl p-6">
          <h2 className="text-[rgba(245,232,200,0.5)] text-xs uppercase tracking-widest mb-6">
            Distribuição de perfis (30d)
          </h2>
          {metrics.profileDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-[rgba(245,232,200,0.2)] text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={metrics.profileDistribution}
                  dataKey="count"
                  nameKey="profileId"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {metrics.profileDistribution.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1006",
                    border: "0.5px solid rgba(212,168,80,0.3)",
                    borderRadius: 8,
                    color: "#f5e8c8",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
