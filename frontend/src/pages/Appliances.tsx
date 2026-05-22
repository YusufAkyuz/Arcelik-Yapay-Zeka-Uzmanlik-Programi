import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAppliances } from "../api/client";
import { formatDateTime } from "../ui/format";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function Appliances() {
  const [filters, setFilters] = useState({ limit: 10, offset: 0 });

  const appliances = useQuery({
    queryKey: ["appliances", filters],
    queryFn: () => getAppliances(filters.limit, filters.offset)
  });

  const page = useMemo(() => Math.floor(filters.offset / filters.limit) + 1, [filters]);

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
        
        {!appliances.isLoading && (
          <div className="pager" style={{ gap: "12px", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px", borderTop: "1px solid var(--table-border)" }}>
            <button
              type="button"
              disabled={filters.offset === 0}
              onClick={() => setFilters((current) => ({ ...current, offset: Math.max(current.offset - current.limit, 0) }))}
              style={{ 
                display: "flex", alignItems: "center", gap: "2px",
                padding: "8px 16px", 
                background: filters.offset === 0 ? "rgba(241, 245, 249, 0.5)" : "white", 
                color: filters.offset === 0 ? "var(--text-secondary)" : "var(--primary-accent)",
                border: "1px solid var(--table-border)", 
                borderRadius: "8px", 
                cursor: filters.offset === 0 ? "not-allowed" : "pointer", 
                opacity: filters.offset === 0 ? 0.7 : 1,
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s ease"
              }}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            <span style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "14px", background: "rgba(241, 245, 249, 0.7)", padding: "6px 12px", borderRadius: "6px" }}>Page {page}</span>
            <button
              type="button"
              disabled={!appliances.data || filters.offset + filters.limit >= appliances.data.total}
              onClick={() => setFilters((current) => ({ ...current, offset: current.offset + current.limit }))}
              style={{ 
                display: "flex", alignItems: "center", gap: "2px",
                padding: "8px 16px", 
                background: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? "rgba(241, 245, 249, 0.5)" : "var(--primary-accent)", 
                color: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? "var(--text-secondary)" : "white",
                border: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? "1px solid var(--table-border)" : "1px solid var(--primary-accent)", 
                borderRadius: "8px", 
                cursor: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? "not-allowed" : "pointer", 
                opacity: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? 0.7 : 1,
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: (!appliances.data || filters.offset + filters.limit >= appliances.data.total) ? "none" : "0 2px 4px rgba(79, 70, 229, 0.2)"
              }}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
