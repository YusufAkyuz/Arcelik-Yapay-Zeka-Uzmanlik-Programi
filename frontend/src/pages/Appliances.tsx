import { useQuery } from "@tanstack/react-query";
import { getAppliances } from "../api/client";
import { formatDateTime } from "../ui/format";
import { Link } from "react-router-dom";

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
                        color: "var(--primary)", 
                        textDecoration: "none", 
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        padding: "4px 8px",
                        border: "1px solid var(--primary)",
                        borderRadius: "4px"
                      }}
                    >
                      View Details →
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
