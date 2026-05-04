import type { Appliance, ApplianceLog, DashboardSummary, LogFilters, Paginated } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

export function getDashboardSummary() {
  return request<DashboardSummary>("/api/dashboard/summary");
}

export function getLogs(filters: LogFilters = {}) {
  const query = toQuery({
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
    appliance_id: filters.appliance_id,
    conn_state: filters.conn_state,
    start: filters.start,
    end: filters.end
  });
  return request<Paginated<ApplianceLog>>(`/api/logs?${query}`);
}

export function getLog(id: number) {
  return request<ApplianceLog>(`/api/logs/${id}`);
}

export function getAppliances(limit = 100, offset = 0) {
  return request<Paginated<Appliance>>(`/api/appliances?limit=${limit}&offset=${offset}`);
}
