import { describe, it, expect } from "vitest";
import { STOREFRONT_CONFIGS } from "./storefront";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("storefront configs", () => {
  it('uses "BidderSweet After Dark" for afterdark storefront name', () => {
    expect(STOREFRONT_CONFIGS.afterdark.name).toBe("BidderSweet After Dark");
  });

  it('uses "BidderSweet Marketplace" for marketplace storefront name', () => {
    expect(STOREFRONT_CONFIGS.marketplace.name).toBe("BidderSweet Marketplace");
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
