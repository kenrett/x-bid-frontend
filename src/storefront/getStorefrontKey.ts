export type StorefrontKey = "main" | "afterdark" | "marketplace";

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

const normalize = (value: string): string => value.trim().toLowerCase();

const readDevOverride = (): StorefrontKey | null => {
  if (!import.meta.env.DEV) return null;
  const raw = import.meta.env.VITE_STOREFRONT_KEY;
  if (raw == null || raw === "") return null;
  const normalized = normalize(raw);
  if (isStorefrontKey(normalized)) return normalized;
  warnInvalidKey("import.meta.env.VITE_STOREFRONT_KEY", raw);
  return null;
};

const readHostname = (hostnameOverride?: string): string => {
  if (typeof hostnameOverride === "string") return hostnameOverride;
  if (typeof window === "undefined") return "";
  const hostname = window.location?.hostname;
  return typeof hostname === "string" ? hostname : "";
};

export function getStorefrontKey(hostnameOverride?: string): StorefrontKey {
  const devOverride = readDevOverride();
  if (devOverride) return devOverride;

  const hostname = normalize(readHostname(hostnameOverride));
  if (hostname.startsWith("afterdark.")) return "afterdark";
  if (hostname.startsWith("marketplace.")) return "marketplace";
  return "main";
}
