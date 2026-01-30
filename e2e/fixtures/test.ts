import { test as base, expect, devices } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
import {
  auction101BidHistory,
  auctionDetail101,
  auctionList,
  authedUser,
  bidPacksResponse,
  fulfillJson,
  getAuthOverride,
  getSessionOverride,
} from "./mocks";

const isApiRequest = (url: string) => url.includes("/api/v1/");

type RouteMatcher = Parameters<Page["route"]>[0];

const escapeRegex = (value: string) =>
  value.replace(/[.+^${}()|[\]\\]/g, "\\$&");

const globToRegExp = (glob: string) => {
  let regex = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      const next = glob[i + 1];
      if (next === "*") {
        regex += ".*";
        i += 1;
      } else {
        regex += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      regex += ".";
      continue;
    }
    regex += escapeRegex(char);
  }
  regex += "$";
  return new RegExp(regex);
};

const matchesUrl = (url: string, matcher: RouteMatcher) => {
  if (typeof matcher === "string") {
    return globToRegExp(matcher).test(url);
  }
  if (matcher instanceof RegExp) return matcher.test(url);
  if (typeof matcher === "function") {
    try {
      return matcher(new URL(url));
    } catch {
      return matcher(url);
    }
  }
  return false;
};

const defaultApiHandler = (url: string, page: Page | null) => {
  const authOverride = page ? getAuthOverride(page) : undefined;
  const sessionOverride = page ? getSessionOverride(page) : undefined;

  if (url.includes("/api/v1/csrf")) {
    return { csrf_token: "e2e_csrf_token" };
  }
  if (url.includes("/api/v1/logged_in")) {
    if (authOverride) {
      return {
        logged_in: true,
        user: authOverride,
        is_admin: Boolean(authOverride.is_admin),
        is_superuser: Boolean(authOverride.is_superuser),
      };
    }
    return { logged_in: false };
  }
  if (url.includes("/api/v1/logout")) {
    return { ok: true };
  }
  if (url.includes("/api/v1/account/security")) {
    if (authOverride) {
      return {
        email_verified: Boolean(authOverride.email_verified),
        email_verified_at: authOverride.email_verified_at ?? null,
      };
    }
    return {
      email_verified: true,
      email_verified_at: authedUser.email_verified_at,
    };
  }
  if (url.includes("/api/v1/session/remaining")) {
    if (sessionOverride) return sessionOverride;
    if (authOverride) {
      return { remaining_seconds: 1800, user: authOverride };
    }
    return { remaining_seconds: 1800 };
  }
  if (url.includes("/api/v1/auctions/101/bid_history")) {
    return auction101BidHistory;
  }
  if (/\/api\/v1\/auctions\/101(?:$|[/?#])/.test(url)) {
    return auctionDetail101;
  }
  if (/\/api\/v1\/auctions(?:$|[?#])/.test(url)) {
    return auctionList;
  }
  if (url.includes("/api/v1/bid_packs")) {
    return bidPacksResponse;
  }
  return null;
};

export const test = base.extend({
  page: async ({ page }, runPage) => {
    const currentPage = page;
    const routeMatchers: RouteMatcher[] = [];
    const originalRoute = page.route.bind(page);
    let recordRoutes = true;

    page.route = (matcher, handler, options) => {
      if (recordRoutes) {
        routeMatchers.push(matcher);
      }
      return originalRoute(matcher, handler, options);
    };

    const shouldFallback = (url: string) =>
      routeMatchers.some((matcher) => matchesUrl(url, matcher));

    recordRoutes = false;
    await originalRoute("**/*", (route) => {
      const url = route.request().url();
      if (!isApiRequest(url)) return route.continue();

      if (shouldFallback(url)) {
        return route.fallback();
      }
      const data = defaultApiHandler(url, currentPage);
      if (data !== null) return fulfillJson(route, data);

      return route.fulfill({
        status: 501,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unhandled API request", url }),
      });
    });
    recordRoutes = true;

    await runPage(page);
  },
});

export { expect, devices };
export type { Page, Route };
