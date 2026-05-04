import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "../api/client";
import { LogTable } from "../ui/LogTable";
import type { ApplianceLog, LogFilters } from "../types";
import { formatDateTime } from "../ui/format";
import { Search, ChevronLeft, ChevronRight, Info } from "lucide-react";

export function Logs() {
  const [filters, setFilters] = useState<LogFilters>({ limit: 25, offset: 0 });
  const [selected, setSelected] = useState<ApplianceLog | null>(null);

  const logs = useQuery({
    queryKey: ["logs", filters],
    queryFn: () => getLogs(filters)
  });

  const page = useMemo(() => Math.floor((filters.offset ?? 0) / (filters.limit ?? 25)) + 1, [filters]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Form değerlerini URL query'ye uygun sade filtre objesine dönüştürüyoruz.
    setFilters({
      appliance_id: String(form.get("appliance_id") || ""),
      conn_state: String(form.get("conn_state") || ""),
      start: String(form.get("start") || ""),
      end: String(form.get("end") || ""),
      limit: 25,
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
          <div className="pager" style={{ gap: "16px" }}>
            <button
              type="button"
              disabled={(filters.offset ?? 0) === 0}
              onClick={() => setFilters((current) => ({ ...current, offset: Math.max((current.offset ?? 0) - 25, 0) }))}
              style={{ background: "white", color: "var(--text-primary)", border: "1px solid var(--table-border)" }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontWeight: "600", color: "var(--text-secondary)", fontSize: "14px" }}>Page {page}</span>
            <button
              type="button"
              disabled={!logs.data || (filters.offset ?? 0) + (filters.limit ?? 25) >= logs.data.total}
              onClick={() => setFilters((current) => ({ ...current, offset: (current.offset ?? 0) + 25 }))}
              style={{ background: "white", color: "var(--text-primary)", border: "1px solid var(--table-border)" }}
            >
              Next <ChevronRight size={16} />
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
