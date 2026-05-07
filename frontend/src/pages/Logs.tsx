import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "../api/client";
import { LogTable } from "../ui/LogTable";
import type { ApplianceLog, LogFilters } from "../types";
import { formatDateTime } from "../ui/format";
import { Search, ChevronLeft, ChevronRight, Info } from "lucide-react";

export function Logs() {
  const [filters, setFilters] = useState<LogFilters>({ limit: 10, offset: 0 });
  const [selected, setSelected] = useState<ApplianceLog | null>(null);

  const logs = useQuery({
    queryKey: ["logs", filters],
    queryFn: () => getLogs(filters)
  });

  const page = useMemo(() => Math.floor((filters.offset ?? 0) / (filters.limit ?? 10)) + 1, [filters]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Form değerlerini URL query'ye uygun sade filtre objesine dönüştürüyoruz.
    setFilters({
      appliance_id: String(form.get("appliance_id") || ""),
      conn_state: String(form.get("conn_state") || ""),
      start: String(form.get("start") || ""),
      end: String(form.get("end") || ""),
      limit: 10,
      offset: 0
    });
    setSelected(null);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Logs</h1>
          <p>Search ingested appliance events by device, status and event time.</p>
        </div>
      </header>

      <form className="filters" onSubmit={submit}>
        <label>
          Appliance ID
          <input name="appliance_id" placeholder="A952..." />
        </label>
        <label>
          State
          <select name="conn_state">
            <option value="">All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </label>
        <label>
          Start
          <input name="start" type="date" />
        </label>
        <label>
          End
          <input name="end" type="date" />
        </label>
        <button type="submit" style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
          <Search size={16} /> Apply
        </button>
      </form>

      <div className="split">
        <section className="panel">
          <div className="panel-header">
            <h2>Results</h2>
            <span>{logs.data?.total ?? 0} records</span>
          </div>
          {logs.isLoading ? (
            <div className="state">Loading logs...</div>
          ) : (
            <LogTable logs={logs.data?.items ?? []} onSelect={setSelected} />
          )}
          <div className="pager" style={{ gap: "12px", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px", borderTop: "1px solid var(--table-border)" }}>
            <button
              type="button"
              disabled={(filters.offset ?? 0) === 0}
              onClick={() => setFilters((current) => ({ ...current, offset: Math.max((current.offset ?? 0) - 10, 0) }))}
              style={{ 
                display: "flex", alignItems: "center", gap: "2px",
                padding: "8px 16px", 
                background: (filters.offset ?? 0) === 0 ? "rgba(241, 245, 249, 0.5)" : "white", 
                color: (filters.offset ?? 0) === 0 ? "var(--text-secondary)" : "var(--primary-accent)",
                border: "1px solid var(--table-border)", 
                borderRadius: "8px", 
                cursor: (filters.offset ?? 0) === 0 ? "not-allowed" : "pointer", 
                opacity: (filters.offset ?? 0) === 0 ? 0.7 : 1,
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
              disabled={!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total}
              onClick={() => setFilters((current) => ({ ...current, offset: (current.offset ?? 0) + 10 }))}
              style={{ 
                display: "flex", alignItems: "center", gap: "2px",
                padding: "8px 16px", 
                background: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? "rgba(241, 245, 249, 0.5)" : "var(--primary-accent)", 
                color: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? "var(--text-secondary)" : "white",
                border: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? "1px solid var(--table-border)" : "1px solid var(--primary-accent)", 
                borderRadius: "8px", 
                cursor: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? "not-allowed" : "pointer", 
                opacity: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? 0.7 : 1,
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s ease",
                boxShadow: (!logs.data || (filters.offset ?? 0) + (filters.limit ?? 10) >= logs.data.total) ? "none" : "0 2px 4px rgba(79, 70, 229, 0.2)"
              }}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <aside className="panel detail">
          <div className="panel-header">
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Info size={18} /> Log Detail</h2>
          </div>
          {selected ? (
            <>
              <dl className="details">
                <dt>Appliance</dt>
                <dd className="mono">{selected.appliance_id}</dd>
                <dt>Timestamp</dt>
                <dd>{formatDateTime(selected.timestamp)}</dd>
                <dt>State</dt>
                <dd><span className={`badge ${selected.conn_state === 'online' ? 'online' : 'offline'}`}>{selected.conn_state ?? "unknown"}</span></dd>
                <dt>Location</dt>
                <dd>{selected.latitude}, {selected.longitude}</dd>
              </dl>
              <div style={{ padding: "0 24px 24px 24px" }}>
                <pre>{JSON.stringify(selected.parsed_data, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="state" style={{ padding: "40px 24px" }}>Select a row to inspect parsed data.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
