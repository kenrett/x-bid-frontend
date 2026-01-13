import { describe, expect, it, vi, beforeEach } from "vitest";
import { getCableRuntimeInfo } from "./cableUrl";

const setEnv = (env: Record<string, unknown>) => {
  (import.meta as unknown as { env: Record<string, unknown> }).env = env;
};

describe("getCableRuntimeInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setEnv({});
  });

  it("uses VITE_CABLE_URL when provided", () => {
    setEnv({
      VITE_CABLE_URL: "wss://ws.example.com/cable?foo=bar",
      VITE_API_URL: "https://api.example.com",
    });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("wss://ws.example.com/cable?foo=bar");
  });

  it("derives wss:// from https VITE_API_URL", () => {
    setEnv({ VITE_API_URL: "https://api.example.com" });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("wss://api.example.com/cable");
  });

  it("derives ws:// from http VITE_API_URL", () => {
    setEnv({ VITE_API_URL: "http://api.example.com" });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("ws://api.example.com/cable");
  });

  it("warns and falls back when VITE_API_URL is invalid", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ VITE_API_URL: "not a url" });
    const info = getCableRuntimeInfo();
    expect(info.computedCableUrl).toBe("/cable");
    expect(warnSpy).toHaveBeenCalledWith(
      "[cable] Falling back to default cable URL",
      expect.objectContaining({
        VITE_API_URL: "not a url",
      }),
    );
  });
});
