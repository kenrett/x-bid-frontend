import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStorefrontConfig, getStorefrontKey } from "./storefront";

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
    value: { ...window.location, hostname },
    writable: true,
  });
};

describe("getStorefrontKey", () => {
  beforeEach(() => {
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("localhost");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("localhost");
  });

  it("uses build-time VITE_STOREFRONT_KEY over hostname", () => {
    applyEnv({ VITE_STOREFRONT_KEY: "artisan" });
    setHostname("afterdark.localhost");
    expect(getStorefrontKey()).toBe("artisan");
  });

  it("derives storefront from hostname when env var is unset", () => {
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("shop-afterdark.localhost");
    expect(getStorefrontKey()).toBe("afterdark");
  });

  it("defaults to main", () => {
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("localhost");
    expect(getStorefrontKey()).toBe("main");
  });

  it("defaults to main and warns on invalid VITE_STOREFRONT_KEY", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    applyEnv({ VITE_STOREFRONT_KEY: "nope" });
    setHostname("artisan.localhost");

    expect(getStorefrontKey()).toBe("main");
    expect(warn).toHaveBeenCalled();
  });

  it('uses "BidderSweet After Dark" for afterdark storefront name', () => {
    applyEnv({ VITE_STOREFRONT_KEY: "afterdark" });
    expect(getStorefrontConfig().name).toBe("BidderSweet After Dark");
  });
});
