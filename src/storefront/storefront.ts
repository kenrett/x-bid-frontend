// src/storefront/storefront.ts

import type { StorefrontKey } from "./getStorefrontKey";
import { getStorefrontKey } from "./getStorefrontKey";
import type { ResolvedColorMode } from "../theme/colorMode";

export { getStorefrontKey, isStorefrontKey } from "./getStorefrontKey";
export type { StorefrontKey } from "./getStorefrontKey";

export type StorefrontThemeTokens = {
  primary: string;
  accent: string;
  surface: string;
  border: string;
  mutedText: string;
  onPrimary: string;
  background: string;
  text: string;
  focusRing: string;
  radius: string;
  shadow: string;
  headingFont: string;
  bodyFont: string;
  status: {
    success: { bg: string; text: string; border: string };
    warning: { bg: string; text: string; border: string };
    error: { bg: string; text: string; border: string };
    info: { bg: string; text: string; border: string };
  };
};

export type StorefrontThemeTokensByMode = Record<
  ResolvedColorMode,
  StorefrontThemeTokens
>;

export type StorefrontConfig = {
  key: StorefrontKey;
  name: string;
  shortName: string;
  badgeLabel: string;
  domain: string;
  themeTokensByMode: StorefrontThemeTokensByMode;
  logoPath: string;
};

export const STOREFRONT_CONFIGS: Record<StorefrontKey, StorefrontConfig> = {
  main: {
    key: "main",
    name: "BidderSweet",
    shortName: "BidderSweet",
    badgeLabel: "Main",
    domain: "biddersweet.app",
    themeTokensByMode: {
      light: {
        // MAIN light = modern, energetic, clean
        primary: "#c62828",
        accent: "#8b5000",
        background: "#f6f5f1",
        surface: "#ffffff",
        border: "rgba(15, 23, 42, 0.20)",
        text: "#0f172a",
        mutedText: "#475569",
        onPrimary: "#ffffff",
        focusRing: "#b91c1c",
        radius: "14px",
        shadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
        headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "#e6f7ec",
            text: "#0f5132",
            border: "#2f855a",
          },
          warning: {
            bg: "#fff4db",
            text: "#7a4a00",
            border: "#b7791f",
          },
          error: {
            bg: "#fde8e8",
            text: "#7f1d1d",
            border: "#c53030",
          },
          info: {
            bg: "#e8f0fe",
            text: "#1e3a8a",
            border: "#3b82f6",
          },
        },
      },
      dark: {
        // MAIN dark = energetic red on slate
        primary: "#ff6b6b",
        accent: "#fbbf24",
        background: "#0b1220",
        surface: "#111b2f",
        border: "rgba(148, 163, 184, 0.45)",
        text: "#f8fafc",
        mutedText: "#cbd5e1",
        onPrimary: "#1f1111",
        focusRing: "#fb7185",
        radius: "14px",
        shadow: "0 18px 48px rgba(2, 6, 23, 0.62)",
        headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "rgba(34, 197, 94, 0.24)",
            text: "#dcfce7",
            border: "rgba(134, 239, 172, 0.75)",
          },
          warning: {
            bg: "rgba(245, 158, 11, 0.25)",
            text: "#fef3c7",
            border: "rgba(252, 211, 77, 0.75)",
          },
          error: {
            bg: "rgba(239, 68, 68, 0.25)",
            text: "#fee2e2",
            border: "rgba(252, 165, 165, 0.75)",
          },
          info: {
            bg: "rgba(59, 130, 246, 0.25)",
            text: "#dbeafe",
            border: "rgba(147, 197, 253, 0.75)",
          },
        },
      },
    },
    logoPath: "/assets/BidderSweet.png",
  },

  afterdark: {
    key: "afterdark",
    name: "BidderSweet After Dark",
    shortName: "Afterdark",
    badgeLabel: "After Dark",
    domain: "afterdark.biddersweet.app",
    themeTokensByMode: {
      light: {
        // AFTER DARK light = violet luxe on pearl
        primary: "#6d28d9",
        accent: "#b45309",
        background: "#faf7ff",
        surface: "#ffffff",
        border: "rgba(91, 33, 182, 0.65)",
        text: "#1f1637",
        mutedText: "#4c3f6b",
        onPrimary: "#ffffff",
        focusRing: "#7c3aed",
        radius: "16px",
        shadow: "0 18px 45px rgba(91, 33, 182, 0.18)",
        headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "#ecfdf3",
            text: "#166534",
            border: "#15803d",
          },
          warning: {
            bg: "#fff8e7",
            text: "#92400e",
            border: "#b45309",
          },
          error: {
            bg: "#fdecec",
            text: "#7f1d1d",
            border: "#b91c1c",
          },
          info: {
            bg: "#eef2ff",
            text: "#3730a3",
            border: "#4338ca",
          },
        },
      },
      dark: {
        // AFTER DARK dark = neon luxe on near-black
        primary: "#b56cff",
        accent: "#f59e0b",
        background: "#0b0b10",
        surface: "rgba(255, 255, 255, 0.06)",
        border: "rgba(255, 255, 255, 0.34)",
        text: "#f8fafc",
        mutedText: "rgba(248, 250, 252, 0.70)",
        onPrimary: "#0b0b10",
        focusRing: "#d8b4fe",
        radius: "16px",
        shadow: "0 18px 50px rgba(0, 0, 0, 0.55)",
        headingFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Zalando Sans Expanded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "rgba(34, 197, 94, 0.22)",
            text: "#dcfce7",
            border: "rgba(134, 239, 172, 0.65)",
          },
          warning: {
            bg: "rgba(245, 158, 11, 0.22)",
            text: "#fef3c7",
            border: "rgba(252, 211, 77, 0.70)",
          },
          error: {
            bg: "rgba(239, 68, 68, 0.22)",
            text: "#fee2e2",
            border: "rgba(252, 165, 165, 0.70)",
          },
          info: {
            bg: "rgba(59, 130, 246, 0.22)",
            text: "#dbeafe",
            border: "rgba(147, 197, 253, 0.70)",
          },
        },
      },
    },
    logoPath: "/assets/AfterDark.png",
  },

  marketplace: {
    key: "marketplace",
    name: "BidderSweet Marketplace",
    shortName: "Marketplace",
    badgeLabel: "Marketplace",
    domain: "marketplace.biddersweet.app",
    themeTokensByMode: {
      light: {
        // MARKETPLACE light = slate commerce
        background: "#ebe1ba",
        surface: "#f8fafc",
        border: "rgba(100, 116, 139, 0.53)",
        text: "#0b1220",
        mutedText: "#475569",
        primary: "#115e59",
        onPrimary: "#ffffff",
        accent: "#92400e",
        focusRing: "#0f766e",
        radius: "14px",
        shadow: "0 18px 55px rgba(0, 0, 0, 0.45)",
        headingFont: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "#e6f7f3",
            text: "#0f4c45",
            border: "#0f766e",
          },
          warning: {
            bg: "#fff7e0",
            text: "#7c3f00",
            border: "#b45309",
          },
          error: {
            bg: "#fdecec",
            text: "#7f1d1d",
            border: "#b91c1c",
          },
          info: {
            bg: "#e8f2ff",
            text: "#1e3a8a",
            border: "#1d4ed8",
          },
        },
      },
      dark: {
        // MARKETPLACE dark = night commerce
        background: "#0f1720",
        surface: "#152030",
        border: "rgba(148, 163, 184, 0.42)",
        text: "#f1f5f9",
        mutedText: "#cbd5e1",
        primary: "#14b8a6",
        onPrimary: "#04211f",
        accent: "#f59e0b",
        focusRing: "#2dd4bf",
        radius: "14px",
        shadow: "0 20px 55px rgba(2, 6, 23, 0.58)",
        headingFont: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        bodyFont: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
        status: {
          success: {
            bg: "rgba(16, 185, 129, 0.24)",
            text: "#d1fae5",
            border: "rgba(110, 231, 183, 0.76)",
          },
          warning: {
            bg: "rgba(245, 158, 11, 0.24)",
            text: "#fef3c7",
            border: "rgba(252, 211, 77, 0.76)",
          },
          error: {
            bg: "rgba(239, 68, 68, 0.24)",
            text: "#fee2e2",
            border: "rgba(252, 165, 165, 0.76)",
          },
          info: {
            bg: "rgba(59, 130, 246, 0.24)",
            text: "#dbeafe",
            border: "rgba(147, 197, 253, 0.76)",
          },
        },
      },
    },
    logoPath: "/assets/Marketplace.png",
  },
};

const DEV_LOCALHOST_PORTS: Record<StorefrontKey, number> = {
  main: 4173,
  afterdark: 4174,
  marketplace: 4175,
};

const DEV_LVH_SUBDOMAINS: Record<StorefrontKey, string> = {
  main: "app",
  afterdark: "afterdark",
  marketplace: "marketplace",
};

const getHostnameParts = (hostname: string): string[] =>
  hostname.split(".").filter(Boolean);

const getBaseDomain = (hostname: string): string => {
  const parts = getHostnameParts(hostname);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
};

const isLvhHost = (hostname: string): boolean =>
  hostname === "lvh.me" || hostname.endsWith(".lvh.me");

const isLocalhostHost = (hostname: string): boolean =>
  hostname === "localhost" || hostname.endsWith(".localhost");

export function getStorefrontConfig(): StorefrontConfig {
  const key = getStorefrontKey();
  return STOREFRONT_CONFIGS[key] ?? STOREFRONT_CONFIGS.main;
}

export function getStorefrontThemeTokens(
  key: StorefrontKey,
  mode: ResolvedColorMode,
): StorefrontThemeTokens {
  const config = STOREFRONT_CONFIGS[key] ?? STOREFRONT_CONFIGS.main;
  return config.themeTokensByMode[mode];
}

export function getStorefrontOrigin(key: StorefrontKey): string {
  const config = STOREFRONT_CONFIGS[key] ?? STOREFRONT_CONFIGS.main;
  if (typeof window === "undefined") return `https://${config.domain}`;

  const hostname = window.location?.hostname?.toLowerCase() ?? "";
  const port = window.location?.port ?? "";
  if (import.meta.env.MODE !== "production") {
    if (isLvhHost(hostname)) {
      const base = getBaseDomain(hostname);
      const subdomain = DEV_LVH_SUBDOMAINS[key] ?? key;
      const portSuffix = port ? `:${port}` : "";
      return `http://${subdomain}.${base}${portSuffix}`;
    }

    if (isLocalhostHost(hostname)) {
      const devPort = DEV_LOCALHOST_PORTS[key];
      const portSuffix = devPort ? `:${devPort}` : "";
      return `http://localhost${portSuffix}`;
    }
  }

  return `https://${config.domain}`;
}
