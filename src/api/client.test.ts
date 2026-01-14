import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import client, { __testOnly, handleResponseError } from "./client";
import { authSessionStore } from "@features/auth/tokenStore";
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const makeAxiosError = ({
  status,
  code,
}: {
  status: number;
  code: string;
}): AxiosError =>
  ({
    isAxiosError: true,
    config: {},
    response: {
      status,
      data: { error_code: code },
      headers: {},
    },
  }) as unknown as AxiosError;

const getHeader = (
  config: AxiosRequestConfig,
  key: string,
): string | undefined => {
  const headers = config.headers as
    | Record<string, unknown>
    | { get?: (value: string) => unknown }
    | undefined;
  if (!headers) return undefined;
  if (typeof headers.get === "function") {
    const value = headers.get(key);
    return typeof value === "string" ? value : undefined;
  }
  const record = headers as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string") return direct;
  const lower = record[key.toLowerCase()];
  if (typeof lower === "string") return lower;
  return undefined;
};

const makeAdapterResponse = (
  config: AxiosRequestConfig,
  data: unknown,
): AxiosResponse => {
  const normalizedConfig = {
    ...(config as InternalAxiosRequestConfig),
    headers: (config.headers as InternalAxiosRequestConfig["headers"]) ?? {},
  };

  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: normalizedConfig,
  };
};

describe("handleResponseError", () => {
  beforeEach(() => {
    vi.spyOn(authSessionStore, "clear").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches app:forbidden and does not clear auth on a generic 403", async () => {
    const forbiddenSpy = vi.fn();
    window.addEventListener("app:forbidden", forbiddenSpy);

    const error = makeAxiosError({ status: 403, code: "forbidden" });

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(authSessionStore.clear).not.toHaveBeenCalled();
    expect(forbiddenSpy).toHaveBeenCalledTimes(1);
    const forbiddenEvent = forbiddenSpy.mock.calls[0]?.[0] as CustomEvent<{
      status: number;
      code: string;
    }>;
    expect(forbiddenEvent.detail).toEqual({
      status: 403,
      code: "forbidden",
    });

    window.removeEventListener("app:forbidden", forbiddenSpy);
  });

  it("clears auth and dispatches app:unauthorized for 403 invalid_session", async () => {
    const unauthorizedSpy = vi.fn();
    window.addEventListener("app:unauthorized", unauthorizedSpy);

    const error = makeAxiosError({ status: 403, code: "invalid_session" });

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(authSessionStore.clear).toHaveBeenCalled();
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
    const unauthorizedEvent = unauthorizedSpy.mock
      .calls[0]?.[0] as CustomEvent<{ status: number; code: string }>;
    expect(unauthorizedEvent.detail).toEqual({
      status: 403,
      code: "invalid_session",
    });

    window.removeEventListener("app:unauthorized", unauthorizedSpy);
  });
});

describe("api client defaults", () => {
  it("always includes credentials", () => {
    expect(client.defaults.withCredentials).toBe(true);
  });
});

describe("csrf handling", () => {
  let originalAdapter: AxiosRequestConfig["adapter"];

  beforeEach(() => {
    __testOnly.clearCsrfToken();
    originalAdapter = client.defaults.adapter;
  });

  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it("attaches csrf token on unsafe requests", async () => {
    const adapter = vi.fn(async (config: AxiosRequestConfig) => {
      if (String(config.url).includes("/api/v1/csrf")) {
        return makeAdapterResponse(config, { csrf_token: "csrf-123" });
      }
      return makeAdapterResponse(config, {});
    });
    client.defaults.adapter = adapter;

    await client.post("/api/v1/example", { ok: true });

    const postCall = adapter.mock.calls.find(([config]) =>
      String(config.url).includes("/api/v1/example"),
    );
    expect(postCall).toBeTruthy();
    const postConfig = postCall?.[0] as AxiosRequestConfig;
    expect(getHeader(postConfig, "X-CSRF-Token")).toBe("csrf-123");
  });

  it("retries once after csrf failure and refreshes token", async () => {
    let csrfCallCount = 0;
    let postCallCount = 0;
    const postHeaders: string[] = [];

    const adapter = vi.fn(async (config: AxiosRequestConfig) => {
      if (String(config.url).includes("/api/v1/csrf")) {
        const token = csrfCallCount === 0 ? "csrf-first" : "csrf-second";
        csrfCallCount += 1;
        return makeAdapterResponse(config, { csrf_token: token });
      }

      if ((config.method ?? "get").toUpperCase() === "POST") {
        postCallCount += 1;
        const headerValue = getHeader(config, "X-CSRF-Token");
        if (headerValue) postHeaders.push(headerValue);

        if (postCallCount === 1) {
          const error = Object.assign(new Error("csrf"), {
            isAxiosError: true,
            config,
            response: {
              status: 403,
              data: { error: { code: "invalid_csrf" } },
              headers: {},
            },
          }) as AxiosError;
          return Promise.reject(error);
        }

        return makeAdapterResponse(config, { ok: true });
      }

      return makeAdapterResponse(config, {});
    });
    client.defaults.adapter = adapter;

    await expect(
      client.post("/api/v1/example", { ok: true }),
    ).resolves.toBeTruthy();
    expect(postCallCount).toBe(2);
    expect(postHeaders).toEqual(["csrf-first", "csrf-second"]);
    expect(csrfCallCount).toBe(2);
  });
});
