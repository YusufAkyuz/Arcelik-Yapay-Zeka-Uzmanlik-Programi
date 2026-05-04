import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboardSummary, getLogs } from "../api/client";
import { LogTable } from "../ui/LogTable";
import { formatDateTime } from "../ui/format";

export function Dashboard() {
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const recentLogs = useQuery({
    queryKey: ["recent-logs"],
    queryFn: () => getLogs({ limit: 12 })
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
            <BarChart data={data.logs_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2f6f73" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent logs</h2>
          <span>{recentLogs.data?.total ?? 0} total</span>
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
