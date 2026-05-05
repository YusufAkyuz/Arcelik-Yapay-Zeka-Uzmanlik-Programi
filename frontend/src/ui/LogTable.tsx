import type { ApplianceLog } from "../types";
import { formatDateTime } from "./format";

type Props = {
  logs: ApplianceLog[];
  compact?: boolean;
  onSelect?: (log: ApplianceLog) => void;
};

export function LogTable({ logs, compact = false, onSelect }: Props) {
  if (logs.length === 0) {
    return <div className="state">No logs found.</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Appliance</th>
          <th>State</th>
          {!compact && <th>Location</th>}
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr
            key={log.id}
            className={onSelect ? "selectable" : undefined}
            onClick={() => onSelect?.(log)}
          >
            <td>{formatDateTime(log.timestamp)}</td>
            <td className="mono">{log.appliance_id}</td>
            <td>
              <span className={`badge ${log.conn_state === "online" ? "online" : "offline"}`}>
                {log.conn_state ?? "unknown"}
              </span>
            </td>
            {!compact && <td>{log.latitude}, {log.longitude}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
