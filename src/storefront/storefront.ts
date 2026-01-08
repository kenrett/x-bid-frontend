export type StorefrontKey = "main" | "afterdark" | "artisan";

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
};

export type StorefrontConfig = {
  key: StorefrontKey;
  name: string;
  shortName: string;
  themeTokens: StorefrontThemeTokens;
  logoPath: string;
};

const VALID_STOREFRONT_KEYS = new Set<StorefrontKey>([
  "main",
  "afterdark",
  "artisan",
]);

const isStorefrontKey = (value: unknown): value is StorefrontKey =>
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
  if (hostname.includes("artisan")) return "artisan";
  return "main";
};

export const STOREFRONT_CONFIGS: Record<StorefrontKey, StorefrontConfig> = {
  main: {
    key: "main",
    name: "BidderSweet",
    shortName: "BidderSweet",
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
    },
    logoPath: "/assets/BidderSweet.svg",
  },
  afterdark: {
    key: "afterdark",
    name: "BidderSweet After Dark",
    shortName: "Afterdark",
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
    },
    logoPath: "/assets/BidderSweet.svg",
  },
  artisan: {
    key: "artisan",
    name: "BidderSweet Artisan",
    shortName: "Artisan",
    themeTokens: {
      primary: "#f59e0b",
      accent: "#22c55e",
      background: "#0d0d1a",
      surface: "rgba(255, 255, 255, 0.06)",
      border: "rgba(255, 255, 255, 0.10)",
      text: "#ffffff",
      mutedText: "rgba(255, 255, 255, 0.70)",
      onPrimary: "#0d0d1a",
      radius: "16px",
      shadow: "0 18px 50px rgba(0, 0, 0, 0.55)",
    },
    logoPath: "/assets/BidderSweet.svg",
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
