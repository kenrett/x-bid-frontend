export type StorefrontKey = "main" | "afterdark" | "artisan";

export type StorefrontThemeTokens = {
  primary: string;
  background: string;
  text: string;
  radius: string;
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
      primary: "#ff69b4",
      background: "#0d0d1a",
      text: "#ffffff",
      radius: "9999px",
    },
    logoPath: "/assets/BidderSweet.svg",
  },
  afterdark: {
    key: "afterdark",
    name: "BidderSweet Afterdark",
    shortName: "Afterdark",
    themeTokens: {
      primary: "#a855f7",
      background: "#0b0b10",
      text: "#f8fafc",
      radius: "9999px",
    },
    logoPath: "/assets/BidderSweet.svg",
  },
  artisan: {
    key: "artisan",
    name: "BidderSweet Artisan",
    shortName: "Artisan",
    themeTokens: {
      primary: "#f59e0b",
      background: "#0d0d1a",
      text: "#ffffff",
      radius: "9999px",
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
