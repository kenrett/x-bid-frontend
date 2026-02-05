type CspEnv = "development" | "production" | "test";

type CspOptions = {
  env: CspEnv;
  apiBaseUrl?: string;
  cableUrl?: string;
};

const DEFAULT_API_BASE_URL = "https://api.biddersweet.app";

const toOrigin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const toWsOrigin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "ws:" || parsed.protocol === "wss:") {
      return parsed.origin;
    }
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

const uniq = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};

const serialize = (directives: Array<[string, string[]]>): string =>
  directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");

export const getCsp = ({ env, apiBaseUrl, cableUrl }: CspOptions): string => {
  const apiOrigin =
    toOrigin(apiBaseUrl && apiBaseUrl.trim() ? apiBaseUrl : undefined) ??
    DEFAULT_API_BASE_URL;
  const wsOrigin =
    toWsOrigin(cableUrl && cableUrl.trim() ? cableUrl : undefined) ??
    toWsOrigin(apiOrigin);

  const devConnectSrc = [
    "http://localhost:*",
    "ws://localhost:*",
    "http://127.0.0.1:*",
    "ws://127.0.0.1:*",
  ];

  const devImgSrc = ["http://localhost:*", "http://127.0.0.1:*"];

  const connectSrc = uniq([
    "'self'",
    apiOrigin,
    wsOrigin,
    "https://api.stripe.com",
    "https://m.stripe.network",
    "https://hooks.stripe.com",
    "https://cloudflareinsights.com",
    ...(env === "development" ? devConnectSrc : []),
  ]);

  const imgSrc = uniq([
    "'self'",
    "data:",
    "blob:",
    apiOrigin,
    "https://robohash.org",
    ...(env === "development" ? devImgSrc : []),
  ]);

  return serialize([
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        "https://js.stripe.com",
        "https://static.cloudflareinsights.com",
      ],
    ],
    [
      "script-src-elem",
      [
        "'self'",
        "https://js.stripe.com",
        "https://static.cloudflareinsights.com",
      ],
    ],
    ["style-src", ["'self'"]],
    ["connect-src", connectSrc],
    ["img-src", imgSrc],
    [
      "frame-src",
      [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com",
        "https://checkout.stripe.com",
      ],
    ],
    ["frame-ancestors", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["form-action", ["'self'"]],
  ]);
};
