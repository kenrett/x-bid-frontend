import axios from "axios";
import client from "../client";

type MaintenanceResponse = {
  maintenance: {
    enabled: boolean;
    updated_at: string | null;
  };
};

export type MaintenanceState = {
  enabled: boolean;
  updated_at: string | null;
};

const normalize = (data: MaintenanceResponse): MaintenanceState => ({
  enabled: Boolean(data?.maintenance?.enabled),
  updated_at: data?.maintenance?.updated_at ?? null,
});

export const getMaintenance = async (): Promise<MaintenanceState> => {
  const res = await client.get<MaintenanceResponse>("/admin/maintenance.json", {
    headers: { Accept: "application/json" },
  });
  return normalize(res.data);
};

export const setMaintenance = async (enabled: boolean): Promise<MaintenanceState> => {
  // Rails controller accepts query param or JSON body; send JSON for clarity.
  const res = await client.post<MaintenanceResponse>(
    "/admin/maintenance.json",
    { enabled },
    { headers: { Accept: "application/json" } }
  );
  return normalize(res.data);
};

export const extractError = (err: unknown): string | null => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? null;
  }
  return null;
};
