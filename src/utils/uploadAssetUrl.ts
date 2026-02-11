const UPLOAD_PATH_PREFIX = "/api/v1/uploads/";
const DEFAULT_API_HOST = "api.biddersweet.app";

const parseHost = (rawUrl: string | undefined): string | undefined => {
  if (!rawUrl) return undefined;
  try {
    return new URL(rawUrl).host;
  } catch {
    return undefined;
  }
};

const getConfiguredApiHost = (): string | undefined => {
  const rawBase =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";

  if (!rawBase || rawBase === "undefined" || rawBase === "null") {
    return undefined;
  }

  return parseHost(rawBase);
};

const getUploadPath = (url: URL): string =>
  `${url.pathname}${url.search}${url.hash}`;

export const normalizeUploadAssetUrl = (
  value: string | null | undefined,
): string => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const configuredApiHost = getConfiguredApiHost();
  const apiHosts = new Set<string>([DEFAULT_API_HOST]);
  if (configuredApiHost) apiHosts.add(configuredApiHost);
  const isApiUploadAsset =
    apiHosts.has(parsed.host) && parsed.pathname.startsWith(UPLOAD_PATH_PREFIX);

  if (!isApiUploadAsset) return trimmed;

  return getUploadPath(parsed);
};
