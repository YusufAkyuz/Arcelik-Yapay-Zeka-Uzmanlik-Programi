import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "../api/client";
import { LogTable } from "../ui/LogTable";
import type { ApplianceLog, LogFilters } from "../types";
import { formatDateTime } from "../ui/format";

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
        <button type="submit">Apply</button>
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
          <div className="pager">
            <button
              type="button"
              disabled={(filters.offset ?? 0) === 0}
              onClick={() => setFilters((current) => ({ ...current, offset: Math.max((current.offset ?? 0) - 25, 0) }))}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={!logs.data || (filters.offset ?? 0) + (filters.limit ?? 25) >= logs.data.total}
              onClick={() => setFilters((current) => ({ ...current, offset: (current.offset ?? 0) + 25 }))}
            >
              Next
            </button>
          </div>
        </section>

        <aside className="panel detail">
          <div className="panel-header">
            <h2>Log detail</h2>
          </div>
          {selected ? (
            <>
              <dl className="details">
                <dt>Appliance</dt>
                <dd>{selected.appliance_id}</dd>
                <dt>Timestamp</dt>
                <dd>{formatDateTime(selected.timestamp)}</dd>
                <dt>State</dt>
                <dd>{selected.conn_state ?? "unknown"}</dd>
                <dt>Location</dt>
                <dd>{selected.latitude}, {selected.longitude}</dd>
              </dl>
              <pre>{JSON.stringify(selected.parsed_data, null, 2)}</pre>
            </>
          ) : (
            <div className="state">Select a row to inspect parsed data.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
