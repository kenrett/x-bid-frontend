import { describe, it, expect } from "vitest";
import {
  STOREFRONT_CONFIGS,
  type StorefrontThemeTokens,
  type StorefrontKey,
} from "./storefront";
import { readFileSync } from "node:fs";
import path from "node:path";

type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const WHITE: RgbaColor = { r: 255, g: 255, b: 255, a: 1 };
const WCAG_AA_NORMAL_TEXT = 4.5;

const parseHexColor = (color: string): RgbaColor => {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) throw new Error(`Unsupported hex color: ${color}`);

  const raw = match[1];
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : raw;

  const value = Number.parseInt(hex, 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    a: 1,
  };
};

const parseRgbColor = (color: string): RgbaColor => {
  const match = color.match(/^rgba?\((.+)\)$/i);
  if (!match) throw new Error(`Unsupported rgb/rgba color: ${color}`);
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    throw new Error(`Unsupported rgb/rgba color: ${color}`);
  }

  const [r, g, b, alpha] = parts;
  const parsed = {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: alpha === undefined ? 1 : Number(alpha),
  };

  if (
    [parsed.r, parsed.g, parsed.b, parsed.a].some((value) =>
      Number.isNaN(value),
    )
  ) {
    throw new Error(`Unsupported rgb/rgba color: ${color}`);
  }

  return parsed;
};

const parseColor = (color: string): RgbaColor => {
  if (color.startsWith("#")) return parseHexColor(color);
  if (color.toLowerCase().startsWith("rgb")) return parseRgbColor(color);
  throw new Error(`Unsupported color token: ${color}`);
};

const composite = (foreground: RgbaColor, background: RgbaColor): RgbaColor => {
  const alpha = Math.min(Math.max(foreground.a, 0), 1);
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
};

const toOpaque = (color: RgbaColor, background: RgbaColor): RgbaColor =>
  color.a >= 1 ? { ...color, a: 1 } : composite(color, background);

const toLinearChannel = (channel: number): number => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (color: RgbaColor): number =>
  0.2126 * toLinearChannel(color.r) +
  0.7152 * toLinearChannel(color.g) +
  0.0722 * toLinearChannel(color.b);

const contrastRatio = (a: RgbaColor, b: RgbaColor): number => {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const [lighter, darker] =
    luminanceA >= luminanceB
      ? [luminanceA, luminanceB]
      : [luminanceB, luminanceA];

  return (lighter + 0.05) / (darker + 0.05);
};

const resolveThemeContrastColors = (themeTokens: StorefrontThemeTokens) => {
  const background = toOpaque(parseColor(themeTokens.background), WHITE);
  const surface = toOpaque(parseColor(themeTokens.surface), background);
  const borderOnSurface = toOpaque(parseColor(themeTokens.border), surface);
  return {
    background,
    surface,
    borderOnSurface,
    primary: toOpaque(parseColor(themeTokens.primary), background),
    accent: toOpaque(parseColor(themeTokens.accent), background),
    onPrimary: toOpaque(parseColor(themeTokens.onPrimary), background),
  };
};

describe("storefront configs", () => {
  it('uses "BidderSweet After Dark" for afterdark storefront name', () => {
    expect(STOREFRONT_CONFIGS.afterdark.name).toBe("BidderSweet After Dark");
  });

  it('uses "BidderSweet Marketplace" for marketplace storefront name', () => {
    expect(STOREFRONT_CONFIGS.marketplace.name).toBe("BidderSweet Marketplace");
  });
});

describe("storefront token contrast", () => {
  it("meets AA contrast for critical primary and accent text usage", () => {
    Object.values(STOREFRONT_CONFIGS).forEach(({ key, themeTokens }) => {
      const colors = resolveThemeContrastColors(themeTokens);

      expect(
        contrastRatio(colors.onPrimary, colors.primary),
        `${key}: onPrimary text on primary buttons`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(
        contrastRatio(colors.primary, colors.surface),
        `${key}: primary text on surface`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(
        contrastRatio(colors.primary, colors.background),
        `${key}: primary text on background`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(
        contrastRatio(colors.accent, colors.surface),
        `${key}: accent text on surface`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(
        contrastRatio(colors.accent, colors.background),
        `${key}: accent text on background`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  it("keeps storefront borders visually distinct from surfaces", () => {
    const minimumBorderContrastByStorefront: Record<StorefrontKey, number> = {
      main: 1.5,
      marketplace: 2.0,
      afterdark: 3.0,
    };

    Object.values(STOREFRONT_CONFIGS).forEach(({ key, themeTokens }) => {
      const colors = resolveThemeContrastColors(themeTokens);
      expect(
        contrastRatio(colors.borderOnSurface, colors.surface),
        `${key}: border against surface`,
      ).toBeGreaterThanOrEqual(minimumBorderContrastByStorefront[key]);
    });
  });

  it("preserves the shared typography tokens", () => {
    const css = readFileSync(path.resolve(__dirname, "../index.css"), "utf-8");
    expect(css).toContain('font-family: "Zalando Sans Expanded"');
    expect(css).toContain("var(--font-sans");
  });
});
