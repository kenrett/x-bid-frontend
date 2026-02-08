export const COLOR_MODE_STORAGE_KEY = "xbid-color-mode";

export type ColorModePreference = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

const VALID_COLOR_MODES = new Set<ColorModePreference>([
  "light",
  "dark",
  "system",
]);

const SYSTEM_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const canUseDom = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const normalizeColorModePreference = (
  value: string | null | undefined,
): ColorModePreference => {
  if (!value) return "system";
  return VALID_COLOR_MODES.has(value as ColorModePreference)
    ? (value as ColorModePreference)
    : "system";
};

export const getSystemColorMode = (): ResolvedColorMode => {
  if (!canUseDom() || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(SYSTEM_MEDIA_QUERY).matches ? "dark" : "light";
};

export const resolveColorMode = (
  preference: ColorModePreference,
  systemMode: ResolvedColorMode = getSystemColorMode(),
): ResolvedColorMode => (preference === "system" ? systemMode : preference);

export const readColorModePreference = (): ColorModePreference => {
  if (!canUseDom()) return "system";
  try {
    return normalizeColorModePreference(
      window.localStorage.getItem(COLOR_MODE_STORAGE_KEY),
    );
  } catch {
    return "system";
  }
};

export const writeColorModePreference = (
  preference: ColorModePreference,
): void => {
  if (!canUseDom()) return;
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
  } catch {
    // Ignore storage write errors and keep runtime state in memory.
  }
};

export const applyColorModeToDocument = (
  preference: ColorModePreference,
): ResolvedColorMode => {
  const effective = resolveColorMode(preference);
  if (!canUseDom()) return effective;

  const root = document.documentElement;
  root.dataset.colorModePreference = preference;
  root.dataset.colorMode = effective;
  root.style.colorScheme = effective;
  return effective;
};

export const getNextColorModePreference = (
  current: ColorModePreference,
): ColorModePreference => {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
};

export const getColorModeLabel = (mode: ColorModePreference): string => {
  if (mode === "system") return "System";
  if (mode === "light") return "Light";
  return "Dark";
};
