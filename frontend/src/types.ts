export type ApplianceLog = {
  id: number;
  appliance_id: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string | null;
  conn_state: string | null;
  parsed_data: Record<string, unknown>;
  created_at: string | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type DashboardSummary = {
  total_logs: number;
  total_appliances: number;
  online_count: number;
  offline_count: number;
  latest_log_timestamp: string | null;
  logs_by_day: Array<{ date: string; count: number }>;
};

export type Appliance = {
  appliance_id: string;
  log_count: number;
  last_seen: string | null;
};

export type LogFilters = {
  appliance_id?: string;
  conn_state?: string;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
};
