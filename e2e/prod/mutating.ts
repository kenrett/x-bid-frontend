import type { Page, TestInfo } from "@playwright/test";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_ALLOWED_MUTATING_PATHS = [/\/cdn-cgi\/rum(?:[/?#]|$)/i];

const getRootDomain = (hostname: string): string => {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join(".");
};

const isSameAppDomain = (candidateHostname: string, baseHostname: string) => {
  if (candidateHostname === baseHostname) return true;
  const root = getRootDomain(baseHostname);
  return candidateHostname === root || candidateHostname.endsWith(`.${root}`);
};

const formatRequest = (method: string, url: URL) =>
  `${method} ${url.toString()}`;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

export const createRunId = (): string => {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
};

export const namespacedLabel = (prefix: string, runId: string): string => {
  const normalizedPrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safePrefix = normalizedPrefix || "smoke";
  return `${safePrefix}-${runId}`;
};

export type MutationCapture = {
  allowed: string[];
  unexpected: string[];
  stop: () => void;
};

export const startMutationCapture = (
  page: Page,
  baseURL: string,
  allowedPathRegexes: RegExp[] = [],
): MutationCapture => {
  const allowed: string[] = [];
  const unexpected: string[] = [];
  const baseHostname = new URL(baseURL).hostname.toLowerCase();
  const allowedPatterns = [
    ...DEFAULT_ALLOWED_MUTATING_PATHS,
    ...allowedPathRegexes,
  ];

  const onRequest = (
    request: Parameters<Page["on"]>[1] extends (
      event: "request",
      listener: infer L,
    ) => unknown
      ? L
      : never,
  ) => {
    if (!MUTATING_METHODS.has(request.method())) return;

    let url: URL;
    try {
      url = new URL(request.url());
    } catch {
      return;
    }
    if (!isSameAppDomain(url.hostname.toLowerCase(), baseHostname)) return;

    const record = formatRequest(request.method(), url);
    if (allowedPatterns.some((pattern) => pattern.test(url.pathname))) {
      allowed.push(record);
      return;
    }
    unexpected.push(record);
  };

  page.on("request", onRequest);

  return {
    allowed,
    unexpected,
    stop: () => {
      page.off("request", onRequest);
    },
  };
};

export type CleanupFailure = {
  label: string;
  message: string;
};

type CleanupFn = () => Promise<void> | void;

export type CleanupRegistry = {
  registerCleanup: (label: string, fn: CleanupFn) => void;
  runCleanup: () => Promise<CleanupFailure[]>;
};

export const createCleanupRegistry = (): CleanupRegistry => {
  const tasks: Array<{ label: string; fn: CleanupFn }> = [];

  return {
    registerCleanup: (label: string, fn: CleanupFn) => {
      tasks.push({ label, fn });
    },
    runCleanup: async () => {
      const failures: CleanupFailure[] = [];
      const pending = [...tasks].reverse();

      for (const task of pending) {
        try {
          await task.fn();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          failures.push({ label: task.label, message });
        }
      }

      return failures;
    },
  };
};

export const attachMutationLedger = async (
  testInfo: TestInfo,
  payload: Record<string, unknown>,
): Promise<void> => {
  const body = {
    generatedAt: new Date().toISOString(),
    ...payload,
  };
  await testInfo.attach("mutation-ledger.json", {
    contentType: "application/json",
    body: Buffer.from(`${JSON.stringify(body, null, 2)}\n`, "utf8"),
  });
};
