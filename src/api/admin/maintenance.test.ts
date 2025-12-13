import { describe, it, expect, beforeEach, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../client", () => ({
  default: {
    get: clientMocks.get,
    post: clientMocks.post,
  },
}));

const axiosIsAxiosError = vi.fn();
vi.mock("axios", () => ({
  default: { isAxiosError: (err: unknown) => axiosIsAxiosError(err) },
  isAxiosError: (err: unknown) => axiosIsAxiosError(err),
}));

import {
  getPublicMaintenance,
  getMaintenance,
  setMaintenance,
  extractError,
  type MaintenanceState,
} from "./maintenance";

const maintenancePayload = (enabled: unknown, updated_at: unknown) => ({
  maintenance: { enabled, updated_at },
});

describe("api/admin/maintenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets public maintenance and normalizes fields", async () => {
    clientMocks.get.mockResolvedValue({
      data: maintenancePayload("truthy", "2024-01-01T00:00:00Z"),
    });

    const state = await getPublicMaintenance();

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/maintenance");
    expect(state).toEqual<MaintenanceState>({
      enabled: true,
      updated_at: "2024-01-01T00:00:00Z",
    });
  });

  it("gets admin maintenance and normalizes null dates", async () => {
    clientMocks.get.mockResolvedValue({
      data: maintenancePayload(false, undefined),
    });

    const state = await getMaintenance();

    expect(clientMocks.get).toHaveBeenCalledWith("/api/v1/admin/maintenance");
    expect(state).toEqual<MaintenanceState>({
      enabled: false,
      updated_at: null,
    });
  });

  it("sets maintenance via POST and normalizes response", async () => {
    clientMocks.post.mockResolvedValue({
      data: maintenancePayload(true, "2024-02-02T00:00:00Z"),
    });

    const state = await setMaintenance(true);

    expect(clientMocks.post).toHaveBeenCalledWith("/api/v1/admin/maintenance", {
      enabled: true,
    });
    expect(state.enabled).toBe(true);
    expect(state.updated_at).toBe("2024-02-02T00:00:00Z");
  });

  it("extracts Axios error messages", () => {
    const err = { response: { data: { error: "boom" } } };
    axiosIsAxiosError.mockReturnValueOnce(true);
    expect(extractError(err)).toBe("boom");

    axiosIsAxiosError.mockReturnValueOnce(false);
    expect(extractError("nope")).toBeNull();
  });
});
