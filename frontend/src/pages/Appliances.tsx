import { useQuery } from "@tanstack/react-query";
import { getAppliances } from "../api/client";
import { formatDateTime } from "../ui/format";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Appliances() {
  const appliances = useQuery({
    queryKey: ["appliances"],
    queryFn: () => getAppliances()
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Appliances</h1>
          <p>Device-level view grouped from the appliance log table.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Known appliances</h2>
          <span>{appliances.data?.total ?? 0} devices</span>
        </div>
        {appliances.isLoading ? (
          <div className="state">Loading appliances...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Appliance ID</th>
                <th>Logs</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {(appliances.data?.items ?? []).map((item) => (
                <tr key={item.appliance_id}>
                  <td className="mono">{item.appliance_id}</td>
                  <td>{item.log_count}</td>
                  <td>{formatDateTime(item.last_seen)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link 
                      to={`/device-details/${item.appliance_id}`}
                      state={{ from: 'appliances' }}
                      style={{ 
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--primary-accent)", 
                        textDecoration: "none", 
                        fontWeight: "600",
                        fontSize: "13px",
                        padding: "6px 12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        borderRadius: "6px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"}
                    >
                      Details <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
