import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
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

  if (loading) return <div className="card shadow">Loading device details...</div>;
  if (error || !detail) return <div className="card shadow" style={{ borderLeft: "4px solid red" }}>Error: {error || "Device not found"}</div>;

  const latest = detail.latest_log || {};
  const stats = latest.parsed_data || {};

  return (
    <div className="appliance-detail-container" style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to={backPath} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "bold" }}>← {backLabel}</Link>
      </div>

      {/* Hero Header Card - Modern & Light Design */}
      <div className="card shadow" style={{ 
        marginBottom: "2rem", 
        background: "white", 
        borderLeft: "6px solid var(--primary)",
        padding: "1.5rem 2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ margin: 0, color: "#1e293b", fontSize: "1.6rem", letterSpacing: "-0.5px" }}>{detail.appliance_id}</h1>
              <span style={{ 
                padding: "4px 12px", 
                borderRadius: "20px", 
                fontSize: "0.7rem",
                background: latest.conn_state === 'online' ? '#dcfce7' : '#fee2e2',
                color: latest.conn_state === 'online' ? '#166534' : '#991b1b',
                fontWeight: "bold",
                textTransform: "uppercase"
              }}>
                {latest.conn_state || "Unknown"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "#64748b", fontSize: "0.85rem" }}>
              <span><strong>Last Contact:</strong> {latest.timestamp ? new Date(latest.timestamp).toLocaleString() : "N/A"}</span>
              <span style={{ color: "#cbd5e1" }}>|</span>
              <span><strong>Location:</strong> {latest.latitude?.toFixed(4)}, {latest.longitude?.toFixed(4)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)", lineHeight: "1" }}>{detail.log_count}</div>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "bold", letterSpacing: "1.5px", marginTop: "4px" }}>TOTAL DATA POINTS</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
        <div className="card shadow">
          <h3 style={{ marginBottom: "1.2rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Technical Snapshot</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>CYCLE COUNT</label>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{stats.CYCLE_COUNT ?? "N/A"}</span>
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>PROGRAM</label>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{stats.BASE_PROGRAM || "N/A"}</span>
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>TEMPERATURE</label>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{stats.TEMP ?? 0}°C</span>
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>SPIN SPEED</label>
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{stats.SPIN ?? 0} RPM</span>
            </div>
          </div>
        </div>

        <div className="card shadow">
          <h3 style={{ marginBottom: "1.2rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Location & Network</h3>
          <div style={{ lineHeight: "2" }}>
            <p><strong>Latitude:</strong> {latest.latitude || "N/A"}</p>
            <p><strong>Longitude:</strong> {latest.longitude || "N/A"}</p>
            <p><strong>Status:</strong> <span style={{ 
              padding: "4px 8px", 
              borderRadius: "4px", 
              fontSize: "0.8rem",
              background: latest.conn_state === 'online' ? '#dcfce7' : '#fee2e2',
              color: latest.conn_state === 'online' ? '#166534' : '#991b1b',
              fontWeight: "bold"
            }}>
              {latest.conn_state?.toUpperCase() || "UNKNOWN"}
            </span></p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card shadow" style={{ marginTop: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Recent Activity</h3>
        <div style={{ overflowX: "auto" }}>
          <LogTable logs={logs} />
        </div>
      </div>
    </div>
  );
}
