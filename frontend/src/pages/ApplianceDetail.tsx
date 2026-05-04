import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Activity, Thermometer, Wind, RefreshCw } from "lucide-react";
import { LogTable } from "../ui/LogTable";

interface ApplianceDetailData {
  appliance_id: string;
  log_count: number;
  latest_log: any;
}

export function ApplianceDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [detail, setDetail] = useState<ApplianceDetailData | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nereden geldiğini bul (default map)
  const from = location.state?.from || 'map';
  const backLabel = from === 'map' ? 'Back to Map' : 'Back to Appliances';
  const backPath = from === 'map' ? '/map' : '/appliances';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    // API isteklerini paralel at
    const fetchDetail = fetch(`http://localhost:5001/api/appliances/${id}`).then(res => {
      if (!res.ok) throw new Error("Device not found");
      return res.json();
    });
    
    const fetchLogs = fetch(`http://localhost:5001/api/appliances/${id}/logs?limit=20`).then(res => res.json());

    Promise.all([fetchDetail, fetchLogs])
      .then(([detailData, logsData]) => {
        setDetail(detailData);
        setLogs(logsData.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching appliance details:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="state">Loading device details...</div>;
  if (error || !detail) return <div className="state error">Error: {error || "Device not found"}</div>;

  const latest = detail.latest_log || {};
  const stats = latest.parsed_data || {};

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Link 
            to={backPath} 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              color: "var(--primary-accent)", 
              textDecoration: "none", 
              fontWeight: "600",
              fontSize: "14px",
              marginBottom: "16px"
            }}
          >
            <ArrowLeft size={16} /> {backLabel}
          </Link>
          <h1>Appliance Details</h1>
          <p>Detailed telemetry and status for device {detail.appliance_id}</p>
        </div>
      </header>

      {/* Hero Header Card - Modern & Light Design */}
      <div className="panel" style={{ padding: "24px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{detail.appliance_id}</h2>
              <span className={`badge ${latest.conn_state === 'online' ? 'online' : 'offline'}`}>
                {latest.conn_state || "Unknown"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "20px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16} /> {latest.timestamp ? new Date(latest.timestamp).toLocaleString() : "N/A"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={16} /> {latest.latitude?.toFixed(4)}, {latest.longitude?.toFixed(4)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "36px", fontWeight: "800", color: "var(--primary-accent)", lineHeight: "1" }}>{detail.log_count}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", letterSpacing: "0.05em", marginTop: "8px", textTransform: "uppercase" }}>Total Data Points</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        <div className="panel">
          <div className="panel-header">
            <h2>Technical Snapshot</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <RefreshCw size={14} /> Cycle Count
              </label>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.CYCLE_COUNT ?? "N/A"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={14} /> Program
              </label>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.BASE_PROGRAM || "N/A"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Thermometer size={14} /> Temperature
              </label>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.TEMP ?? 0}°C</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Wind size={14} /> Spin Speed
              </label>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.SPIN ?? 0} RPM</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Location & Network</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", color: "var(--text-primary)", fontWeight: "500" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--table-border)", paddingBottom: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Latitude</span>
              <span>{latest.latitude || "N/A"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--table-border)", paddingBottom: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Longitude</span>
              <span>{latest.longitude || "N/A"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)" }}>Status</span>
              <span className={`badge ${latest.conn_state === 'online' ? 'online' : 'offline'}`}>
                {latest.conn_state?.toUpperCase() || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="panel">
        <div className="panel-header">
          <h2>Recent Activity</h2>
          <span>Latest {logs.length} events</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <LogTable logs={logs} />
        </div>
      </div>
    </div>
  );
}
