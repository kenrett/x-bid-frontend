import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStorefrontKey } from "./getStorefrontKey";

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
    setHostname("www.biddersweet.app");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    applyEnv({ VITE_STOREFRONT_KEY: "" });
    setHostname("www.biddersweet.app");
  });

  it("uses the DEV override when provided", () => {
    applyEnv({ VITE_STOREFRONT_KEY: "AfterDark" });
    setHostname("marketplace.biddersweet.app");
    expect(getStorefrontKey()).toBe("afterdark");
  });

  it("derives afterdark from hostname", () => {
    expect(getStorefrontKey("afterdark.biddersweet.app")).toBe("afterdark");
  });

  it("derives marketplace from hostname", () => {
    expect(getStorefrontKey("Marketplace.biddersweet.app")).toBe("marketplace");
  });

  it("defaults to main for other hostnames", () => {
    expect(getStorefrontKey("www.biddersweet.app")).toBe("main");
    expect(getStorefrontKey("shop-afterdark.biddersweet.app")).toBe("main");
  });

  it("defaults to main for empty hostname", () => {
    expect(getStorefrontKey("")).toBe("main");
    expect(getStorefrontKey()).toBe("main");
  });

  it("falls back to hostname when DEV override is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    applyEnv({ VITE_STOREFRONT_KEY: "nope" });
    expect(getStorefrontKey("afterdark.biddersweet.app")).toBe("afterdark");
    expect(warn).toHaveBeenCalled();
  });
});
