export type AppMode = "storefront" | "account";

const VALID_APP_MODES = new Set<AppMode>(["storefront", "account"]);

const isAppMode = (value: unknown): value is AppMode =>
  typeof value === "string" && VALID_APP_MODES.has(value as AppMode);

const warnInvalidMode = (source: string, value: unknown) => {
  console.warn(
    `[appMode] Invalid app mode from ${source}: ${JSON.stringify(
      value,
    )}; defaulting to "storefront".`,
  );
};

const readBuildTimeMode = (): AppMode | null => {
  const raw = import.meta.env.VITE_APP_MODE;
  if (raw == null || raw === "") return null;
  if (isAppMode(raw)) return raw;
  warnInvalidMode("import.meta.env.VITE_APP_MODE", raw);
  return "storefront";
};

const readRuntimeMode = (): AppMode => {
  const hostname =
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.hostname === "string"
      ? window.location.hostname.toLowerCase()
      : "";

  // Dev-only fallback: production uses separate builds per mode.
  if (hostname === "account" || hostname.startsWith("account."))
    return "account";

  return "storefront";
};

/**
 * Canonical app mode derivation (single source of truth).
 *
 * Note: Vite `VITE_*` env vars are baked at build time. Production typically
 * builds one artifact per mode; hostname derivation is a dev-only fallback.
 */
export function getAppMode(): AppMode {
  const buildTime = readBuildTimeMode();
  if (buildTime) return buildTime;
  return readRuntimeMode();
}
