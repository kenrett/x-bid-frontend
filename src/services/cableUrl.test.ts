import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getCableConnectionInfo, getCableRuntimeInfo } from "./cableUrl";

const originalEnv = { ...import.meta.env };

const applyEnv = (overrides: Record<string, unknown>) => {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(originalEnv),
    ...Object.keys(overrides),
  ]);
  for (const key of keys) {
    env[key] =
      key in overrides
        ? overrides[key]
        : (originalEnv as Record<string, unknown>)[key];
  }
};

describe("getCableRuntimeInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    applyEnv({ VITE_CABLE_URL: "" });
  });

  afterEach(() => {
    applyEnv({ VITE_CABLE_URL: "" });
  });

  it("uses VITE_CABLE_URL when provided", () => {
    applyEnv({
      VITE_CABLE_URL: "wss://ws.example.com/cable?foo=bar",
      VITE_API_URL: "https://api.example.com",
    });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("wss://ws.example.com/cable?foo=bar");
  });

  it("derives wss:// from https VITE_API_URL", () => {
    applyEnv({
      VITE_API_URL: "https://api.example.com",
      VITE_CABLE_URL: "",
    });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("wss://api.example.com/cable");
  });

  it("derives ws:// from http VITE_API_URL", () => {
    applyEnv({
      VITE_API_URL: "http://api.example.com",
      VITE_CABLE_URL: "",
    });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("ws://api.example.com/cable");
  });

  it("warns and falls back when VITE_API_URL is invalid", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    applyEnv({ VITE_API_URL: "not a url", VITE_CABLE_URL: "" });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("/cable");
    expect(warnSpy).toHaveBeenCalledWith(
      "[cable] Falling back to default cable URL",
      expect.objectContaining({
        VITE_API_URL: "not a url",
      }),
    );
  });

  it("appends storefront to the connection URL", () => {
    applyEnv({
      VITE_API_URL: "https://api.example.com",
      VITE_CABLE_URL: "",
      VITE_STOREFRONT_KEY: "afterdark",
    });
    const info = getCableConnectionInfo();
    expect(info.connectionUrl).toBe(
      "wss://api.example.com/cable?storefront=afterdark",
    );
  });
});
