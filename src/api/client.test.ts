import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosHeaders } from "axios";

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

const setHostname = (hostname: string) => {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      hostname,
      host: hostname,
      origin: `https://${hostname}`,
    },
    writable: true,
  });
};

describe("api client", () => {
  let originalAdapter: typeof import("./client").default.defaults.adapter;
  let client: typeof import("./client").default;

  beforeEach(async () => {
    applyEnv({
      VITE_API_BASE_URL: "https://api.biddersweet.app",
      VITE_STOREFRONT_KEY: "",
    });
    setHostname("marketplace.biddersweet.app");
    vi.resetModules();
    client = (await import("./client")).default;
    originalAdapter = client.defaults.adapter;
  });

  afterEach(() => {
    applyEnv({});
    client.defaults.adapter = originalAdapter;
  });

  it("sends X-Storefront-Key and includes credentials", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.get("/api/v1/ping");

    const config = adapter.mock.calls.at(0)?.[0];
    if (!config) throw new Error("adapter not called");

    const headers = config.headers;
    const headerValue =
      headers instanceof AxiosHeaders
        ? headers.get("X-Storefront-Key")
        : (headers as Record<string, string | undefined>)["X-Storefront-Key"];

    expect(headerValue).toBe("marketplace");
    expect(config.withCredentials).toBe(true);
  });

  it("uses runtime API base for biddersweet hostnames and includes credentials", async () => {
    applyEnv({
      VITE_API_BASE_URL: undefined,
      VITE_STOREFRONT_KEY: "",
    });
    setHostname("afterdark.biddersweet.app");
    vi.resetModules();
    client = (await import("./client")).default;
    originalAdapter = client.defaults.adapter;

    const adapter = vi.fn(async (config) => {
      const isCsrf =
        typeof config.url === "string" && config.url.includes("/api/v1/csrf");
      return {
        data: isCsrf ? { csrf_token: "token" } : {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    });

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.post("/api/v1/uploads", {});

    const uploadConfig = adapter.mock.calls
      .map((call) => call[0])
      .find(
        (config) =>
          typeof config.url === "string" &&
          config.url.includes("/api/v1/uploads"),
      );

    if (!uploadConfig) throw new Error("upload request not captured");

    expect(uploadConfig.url).toBe("https://api.biddersweet.app/api/v1/uploads");
    expect(uploadConfig.withCredentials).toBe(true);
  });

  it("forces credentials on upload requests", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.post("/api/v1/uploads", {}, { withCredentials: false });

    const uploadConfig = adapter.mock.calls
      .map((call) => call[0])
      .find(
        (config) =>
          typeof config.url === "string" &&
          config.url.includes("/api/v1/uploads"),
      );

    if (!uploadConfig) throw new Error("upload request not captured");

    expect(uploadConfig.withCredentials).toBe(true);
  });
});
