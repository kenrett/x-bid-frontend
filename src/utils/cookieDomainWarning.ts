let didWarnCookieDomainMismatch = false;

const getHostname = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const getRegistrableDomain = (hostname: string): string => {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
};

export const warnIfCookieDomainMismatch = (
  apiBaseUrl: string | undefined,
  source?: string,
): void => {
  if (didWarnCookieDomainMismatch) return;
  if (!apiBaseUrl) return;
  if (typeof window === "undefined") return;

  const appHostname = window.location?.hostname;
  if (!appHostname) return;

  const apiHostname = getHostname(apiBaseUrl);
  if (!apiHostname) return;

  const appDomain = getRegistrableDomain(appHostname);
  const apiDomain = getRegistrableDomain(apiHostname);
  if (appDomain === apiDomain) return;

  didWarnCookieDomainMismatch = true;
  console.warn(
    `[auth] Cookie auth requires API to be on a subdomain of the app (e.g. api.biddersweet.app). You're using ${apiHostname} so cookies won't be shared across storefronts.`,
    {
      app_hostname: appHostname,
      api_hostname: apiHostname,
      app_domain: appDomain,
      api_domain: apiDomain,
      api_base_url: apiBaseUrl,
      source,
    },
  );
};
