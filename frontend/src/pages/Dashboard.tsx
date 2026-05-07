import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboardSummary, getLogs } from "../api/client";
import { LogTable } from "../ui/LogTable";
import { formatDateTime } from "../ui/format";

export function Dashboard() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const recentLogs = useQuery({
    queryKey: ["recent-logs", page],
    queryFn: () => getLogs({ limit, offset: page * limit })
  });

  if (summary.isLoading) {
    return <div className="state">Loading dashboard...</div>;
  }

  if (summary.isError) {
    return <div className="state error">Dashboard data could not be loaded.</div>;
  }

  const data = summary.data;
  if (!data) {
    return <div className="state">No dashboard data returned.</div>;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>Live view of Mercek log ingestion and appliance activity.</p>
        </div>
      </header>

      <div className="metric-grid">
        <Metric label="Total logs" value={data.total_logs.toLocaleString()} />
        <Metric label="Appliances" value={data.total_appliances.toLocaleString()} />
        <Metric label="Online logs" value={data.online_count.toLocaleString()} />
        <Metric label="Latest event" value={formatDateTime(data.latest_log_timestamp)} />
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Log volume</h2>
          <span>Last 14 days</span>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.logs_by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.95)' }}
                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
              />
              <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent logs</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{recentLogs.data?.total ?? 0} total</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                style={{ padding: "4px 10px", background: "white", border: "1px solid var(--table-border)", borderRadius: "6px", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={!recentLogs.data || (page + 1) * limit >= recentLogs.data.total}
                style={{ padding: "4px 10px", background: "white", border: "1px solid var(--table-border)", borderRadius: "6px", cursor: (!recentLogs.data || (page + 1) * limit >= recentLogs.data.total) ? "not-allowed" : "pointer", opacity: (!recentLogs.data || (page + 1) * limit >= recentLogs.data.total) ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <LogTable logs={recentLogs.data?.items ?? []} compact />
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
