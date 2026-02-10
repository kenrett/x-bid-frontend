import type { Page } from "@playwright/test";

const CRITICAL_RESOURCE_TYPES = new Set([
  "document",
  "script",
  "stylesheet",
  "xhr",
  "fetch",
]);

export const isKnownInlineCspViolation = (message: string) =>
  message.includes("Executing inline script violates") &&
  message.includes("Content Security Policy directive 'script-src-elem");

type RuntimeErrorSignals = {
  consoleErrors: string[];
  pageErrors: string[];
};

export const captureRuntimeErrorSignals = (page: Page): RuntimeErrorSignals => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  return { consoleErrors, pageErrors };
};

const getRootDomain = (hostname: string): string => {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
};

const isCriticalDomain = (hostname: string, baseHostname: string): boolean => {
  if (hostname === baseHostname) return true;
  const baseRoot = getRootDomain(baseHostname);
  return hostname === baseRoot || hostname.endsWith(`.${baseRoot}`);
};

type NetworkSignals = {
  failedRequests: string[];
  serverErrors: string[];
  slowResponses: string[];
};

export const captureNetworkSignals = (
  page: Page,
  baseURL: string,
  slowResponseMs = 3_000,
): NetworkSignals => {
  const failedRequests: string[] = [];
  const serverErrors: string[] = [];
  const slowResponses: string[] = [];

  const baseHostname = new URL(baseURL).hostname;

  page.on("requestfailed", (request) => {
    if (!CRITICAL_RESOURCE_TYPES.has(request.resourceType())) return;

    const url = new URL(request.url());
    if (!isCriticalDomain(url.hostname, baseHostname)) return;

    const reason = request.failure()?.errorText ?? "unknown";
    failedRequests.push(
      `${request.method()} ${request.resourceType()} ${url.toString()} (${reason})`,
    );
  });

  page.on("response", (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    if (!CRITICAL_RESOURCE_TYPES.has(resourceType)) return;

    const url = new URL(response.url());
    if (!isCriticalDomain(url.hostname, baseHostname)) return;

    if (response.status() >= 500) {
      serverErrors.push(
        `${response.status()} ${request.method()} ${resourceType} ${url.toString()}`,
      );
    }

    const timing = request.timing();
    if (typeof timing.responseEnd === "number" && timing.responseEnd > 0) {
      if (timing.responseEnd > slowResponseMs) {
        slowResponses.push(
          `${Math.round(timing.responseEnd)}ms ${request.method()} ${resourceType} ${url.toString()}`,
        );
      }
    }
  });

  return { failedRequests, serverErrors, slowResponses };
};
