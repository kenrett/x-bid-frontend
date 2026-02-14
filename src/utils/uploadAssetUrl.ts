const UPLOAD_PATH_PREFIX = "/api/v1/uploads/";
const DEFAULT_API_ORIGIN = "https://api.biddersweet.app";

const normalizeApiOrigin = (value: string | undefined): string | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/i.test(parsed.protocol)) return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
};

const getConfiguredApiOrigin = (): string | undefined =>
  normalizeApiOrigin(
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL
      : undefined,
  );

const getApiOrigin = (): string =>
  getConfiguredApiOrigin() ?? DEFAULT_API_ORIGIN;

const toAbsoluteApiUploadUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getApiOrigin()).toString();
};

export const normalizeUploadAssetUrl = (
  value: string | null | undefined,
): string => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (
    trimmed.startsWith(UPLOAD_PATH_PREFIX) ||
    trimmed.startsWith(UPLOAD_PATH_PREFIX.slice(1))
  ) {
    try {
      return toAbsoluteApiUploadUrl(trimmed);
    } catch {
      // Preserve input on malformed URL construction.
      return trimmed;
    }
  }

  return trimmed;
};
