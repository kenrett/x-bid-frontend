export type StorefrontKey = "main" | "afterdark" | "marketplace";

export type StorefrontThemeTokens = {
  primary: string;
  accent: string;
  surface: string;
  border: string;
  mutedText: string;
  onPrimary: string;
  background: string;
  text: string;
  radius: string;
  shadow: string;
  headingFont: string;
  bodyFont: string;
};

export type StorefrontConfig = {
  key: StorefrontKey;
  name: string;
  shortName: string;
  badgeLabel: string;
  domain: string;
  themeTokens: StorefrontThemeTokens;
  logoPath: string;
};

const VALID_STOREFRONT_KEYS = new Set<StorefrontKey>([
  "main",
  "afterdark",
  "marketplace",
]);

export const isStorefrontKey = (value: unknown): value is StorefrontKey =>
  typeof value === "string" &&
  VALID_STOREFRONT_KEYS.has(value as StorefrontKey);

const warnInvalidKey = (source: string, value: unknown) => {
  console.warn(
    `[storefront] Invalid storefront key from ${source}: ${JSON.stringify(
      value,
    )}; defaulting to "main".`,
  );
};

const readBuildTimeKey = (): StorefrontKey | null => {
  const raw = import.meta.env.VITE_STOREFRONT_KEY;
  if (raw == null || raw === "") return null;
  if (isStorefrontKey(raw)) return raw;
  warnInvalidKey("import.meta.env.VITE_STOREFRONT_KEY", raw);
  return "main";
};

const readRuntimeKey = (): StorefrontKey => {
  const hostname =
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.hostname === "string"
      ? window.location.hostname.toLowerCase()
      : "";

  // Dev-only fallback: production uses separate builds per storefront.
  if (hostname.includes("afterdark")) return "afterdark";
  if (hostname.includes("marketplace")) return "marketplace";
  return "main";
};

export const STOREFRONT_CONFIGS: Record<StorefrontKey, StorefrontConfig> = {
  main: {
    key: "main",
    name: "BidderSweet",
    shortName: "BidderSweet",
    badgeLabel: "Main",
    domain: "biddersweet.app",
    themeTokens: {
      primary: "#ff4d4f",
      accent: "#f6c177",
      background: "#f6f5f1",
      surface: "#ffffff",
      border: "rgba(15, 23, 42, 0.12)",
      text: "#0f172a",
      mutedText: "#475569",
      onPrimary: "#ffffff",
      radius: "14px",
      shadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
      headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    },
    logoPath: "/assets/BidderSweet.png",
  },
  afterdark: {
    key: "afterdark",
    name: "BidderSweet After Dark",
    shortName: "Afterdark",
    badgeLabel: "After Dark",
    domain: "afterdark.biddersweet.app",
    themeTokens: {
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
      headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    },
    logoPath: "/assets/AfterDark.png",
  },
  marketplace: {
    key: "marketplace",
    name: "BidderSweet Artisan",
    shortName: "Artisan",
    badgeLabel: "Artisan",
    domain: "marketplace.biddersweet.app",
    themeTokens: {
      primary: "#3c5e45",
      accent: "#c57c37",
      background: "#f6efe2",
      surface: "#fffaf4",
      border: "rgba(141, 114, 91, 0.45)",
      text: "#352b1f",
      mutedText: "#705e4b",
      onPrimary: "#fff8ef",
      radius: "18px",
      shadow: "0 18px 55px rgba(56, 53, 44, 0.35)",
      headingFont: `"Cormorant Garamond", "Times New Roman", "Noto Serif", serif`,
      bodyFont: `"Zalando Sans Expanded", "Segoe UI", system-ui, sans-serif`,
    },
    logoPath: "/assets/Marketplace.png",
  },
};

/**
 * Canonical storefront key derivation (single source of truth).
 *
 * Note: Vite `VITE_*` env vars are baked at build time. Production typically
 * builds one artifact per storefront; hostname derivation is a dev-only fallback.
 */
export function getStorefrontKey(): StorefrontKey {
  const buildTime = readBuildTimeKey();
  if (buildTime) return buildTime;
  return readRuntimeKey();
}

export function getStorefrontConfig(): StorefrontConfig {
  const key = getStorefrontKey();
  return STOREFRONT_CONFIGS[key] ?? STOREFRONT_CONFIGS.main;
}
