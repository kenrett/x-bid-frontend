import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getStorefrontConfig,
  getStorefrontKey,
  STOREFRONT_CONFIGS,
} from "./storefront";
import { readFileSync } from "node:fs";
import path from "node:path";

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
    applyEnv({ VITE_STOREFRONT_KEY: "marketplace" });
    setHostname("afterdark.localhost");
    expect(getStorefrontKey()).toBe("marketplace");
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
    setHostname("marketplace.localhost");

    expect(getStorefrontKey()).toBe("main");
    expect(warn).toHaveBeenCalled();
  });

  it('uses "BidderSweet After Dark" for afterdark storefront name', () => {
    applyEnv({ VITE_STOREFRONT_KEY: "afterdark" });
    expect(getStorefrontConfig().name).toBe("BidderSweet After Dark");
  });

  it('uses "BidderSweet Artisan" for marketplace storefront name', () => {
    applyEnv({ VITE_STOREFRONT_KEY: "marketplace" });
    expect(getStorefrontKey()).toBe("marketplace");
    expect(getStorefrontConfig().name).toBe("BidderSweet Artisan");
  });
});

describe("afterdark storefront styling", () => {
  it("keeps the dark palette intact", () => {
    expect(STOREFRONT_CONFIGS.afterdark.themeTokens).toEqual({
      primary: "#a855f7",
      accent: "#f59e0b",
      background: "#0b0b10",
      surface: "rgba(255, 255, 255, 0.06)",
      border: "rgba(255, 255, 255, 0.10)",
      text: "#f8fafc",
      mutedText: "rgba(248, 250, 252, 0.70)",
      onPrimary: "#0b0b10",
      radius: "16px",
      shadow: "0 18px 50px rgba(0, 0, 0, 0.55)",
      headingFont:
        '"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      bodyFont:
        '"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    });
  });

  it("preserves the shared typography tokens", () => {
    const css = readFileSync(path.resolve(__dirname, "../index.css"), "utf-8");
    expect(css).toContain('font-family: "Zalando Sans Expanded"');
    expect(css).toContain("var(--font-sans");
  });
});
