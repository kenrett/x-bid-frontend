import axios from "axios";
import client from "../client";
import type { ApiJsonResponse } from "../openapi-helpers";

export type MaintenanceState = {
  enabled: boolean;
  updated_at: string | null;
};

type MaintenanceResponse =
  | ApiJsonResponse<"/api/v1/admin/maintenance", "get">
  | ApiJsonResponse<"/api/v1/maintenance", "get">
  | { maintenance?: { enabled?: unknown; updated_at?: unknown } };

export const getPublicMaintenance = async (): Promise<MaintenanceState> => {
  const res = await client.get<MaintenanceResponse>("/maintenance");
  return normalize(res.data);
};

const normalize = (data: MaintenanceResponse): MaintenanceState => ({
  enabled: Boolean(data?.maintenance?.enabled),
  updated_at: data?.maintenance?.updated_at ?? null,
});

export const getMaintenance = async (): Promise<MaintenanceState> => {
  const res = await client.get<MaintenanceResponse>("/admin/maintenance");
  return normalize(res.data);
};

export const setMaintenance = async (
  enabled: boolean,
): Promise<MaintenanceState> => {
  // Rails controller accepts query param or JSON body; send JSON for clarity.
  const res = await client.post<MaintenanceResponse>("/admin/maintenance", {
    enabled,
  });
  return normalize(res.data);
};

export const extractError = (err: unknown): string | null => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? null;
  }
  return null;
};
