import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { authSessionStore } from "@features/auth/tokenStore";

const originalEnv = { ...import.meta.env };

const applyEnv = (overrides: Record<string, unknown>) => {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(originalEnv),
    ...Object.keys(overrides),
  ]);
  for (const key of keys) {
    env[key] =
      key in overrides
        ? overrides[key]
        : (originalEnv as Record<string, unknown>)[key];
  }
};

const setHostname = (hostname: string) => {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      hostname,
      host: hostname,
      origin: `https://${hostname}`,
    },
    writable: true,
  });
};

describe("api client", () => {
  let originalAdapter: typeof import("./client").default.defaults.adapter;
  let client: typeof import("./client").default;
  let handleResponseError: typeof import("./client").handleResponseError;

  beforeEach(async () => {
    applyEnv({
      VITE_API_BASE_URL: "https://api.biddersweet.app",
      VITE_STOREFRONT_KEY: "",
    });
    setHostname("marketplace.biddersweet.app");
    vi.resetModules();
    const clientModule = await import("./client");
    client = clientModule.default;
    handleResponseError = clientModule.handleResponseError;
    originalAdapter = client.defaults.adapter;
    authSessionStore.clear();
  });

  afterEach(() => {
    applyEnv({});
    client.defaults.adapter = originalAdapter;
  });

  it("sends X-Storefront-Key and includes credentials", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.get("/api/v1/ping");

    const config = adapter.mock.calls.at(0)?.[0];
    if (!config) throw new Error("adapter not called");

    const headers = config.headers;
    const headerValue =
      headers instanceof AxiosHeaders
        ? headers.get("X-Storefront-Key")
        : (headers as Record<string, string | undefined>)["X-Storefront-Key"];

    expect(headerValue).toBe("marketplace");
    expect(config.withCredentials).toBe(true);
  });

  it("uses runtime API base for biddersweet hostnames and includes credentials", async () => {
    applyEnv({
      VITE_API_BASE_URL: undefined,
      VITE_STOREFRONT_KEY: "",
    });
    setHostname("afterdark.biddersweet.app");
    vi.resetModules();
    client = (await import("./client")).default;
    originalAdapter = client.defaults.adapter;

    const adapter = vi.fn(async (config) => {
      const isCsrf =
        typeof config.url === "string" && config.url.includes("/api/v1/csrf");
      return {
        data: isCsrf ? { csrf_token: "token" } : {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    });

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.post("/api/v1/uploads", {});

    const uploadConfig = adapter.mock.calls
      .map((call) => call[0])
      .find(
        (config) =>
          typeof config.url === "string" &&
          config.url.includes("/api/v1/uploads"),
      );

    if (!uploadConfig) throw new Error("upload request not captured");

    expect(uploadConfig.url).toBe("https://api.biddersweet.app/api/v1/uploads");
    expect(uploadConfig.withCredentials).toBe(true);
  });

  it("forces credentials on upload requests", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    client.defaults.adapter = adapter as typeof originalAdapter;
    await client.post("/api/v1/uploads", {}, { withCredentials: false });

    const uploadConfig = adapter.mock.calls
      .map((call) => call[0])
      .find(
        (config) =>
          typeof config.url === "string" &&
          config.url.includes("/api/v1/uploads"),
      );

    if (!uploadConfig) throw new Error("upload request not captured");

    expect(uploadConfig.withCredentials).toBe(true);
  });

  it("does not dispatch app:unauthorized for missing-credential auth probes", async () => {
    const onUnauthorized = vi.fn();
    window.addEventListener("app:unauthorized", onUnauthorized);

    const error = {
      config: { url: "https://api.biddersweet.app/api/v1/logged_in" },
      response: {
        status: 401,
        data: {
          error: {
            code: "invalid_token",
            details: { reason: "missing_authorization_header" },
          },
        },
      },
    } as AxiosError;

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(onUnauthorized).not.toHaveBeenCalled();
    window.removeEventListener("app:unauthorized", onUnauthorized);
  });

  it("dispatches app:unauthorized for expired sessions", async () => {
    const onUnauthorized = vi.fn();
    window.addEventListener("app:unauthorized", onUnauthorized);

    const error = {
      config: { url: "https://api.biddersweet.app/api/v1/session/remaining" },
      response: {
        status: 401,
        data: {
          error: {
            code: "invalid_token",
            details: { reason: "expired_session" },
          },
        },
      },
    } as AxiosError;

    await expect(handleResponseError(error)).rejects.toBe(error);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener("app:unauthorized", onUnauthorized);
  });

  it("retries login when invalid_token response message indicates CSRF failure", async () => {
    let csrfFetches = 0;
    let loginAttempts = 0;
    const loginTokens: string[] = [];

    const adapter: NonNullable<typeof client.defaults.adapter> = async (
      config,
    ) => {
      const url = typeof config.url === "string" ? config.url : "";
      const csrfHeaderValue = new AxiosHeaders(config.headers).get(
        "X-CSRF-Token",
      );
      const csrfHeader =
        typeof csrfHeaderValue === "string" ? csrfHeaderValue : "";

      const makeResponse = (
        data: unknown,
        status: number,
        statusText: string,
      ): AxiosResponse => ({
        data,
        status,
        statusText,
        headers: {},
        config,
      });

      if (url.includes("/api/v1/csrf")) {
        csrfFetches += 1;
        return makeResponse({ csrf_token: `token-${csrfFetches}` }, 200, "OK");
      }

      if (url.includes("/api/v1/login")) {
        loginAttempts += 1;
        loginTokens.push(csrfHeader);

        if (loginAttempts === 1) {
          const response = makeResponse(
            {
              error: {
                code: "invalid_token",
                message: "CSRF token verification failed",
                details: { reason: "csrf_token_verification_failed" },
              },
            },
            401,
            "Unauthorized",
          );
          return Promise.reject(
            new AxiosError(
              "Request failed with status code 401",
              AxiosError.ERR_BAD_REQUEST,
              config,
              undefined,
              response,
            ),
          );
        }

        return makeResponse({ ok: true }, 200, "OK");
      }

      return makeResponse({}, 200, "OK");
    };

    client.defaults.adapter = adapter;
    const response = await client.post("/api/v1/login", {});

    expect(response.status).toBe(200);
    expect(csrfFetches).toBe(2);
    expect(loginAttempts).toBe(2);
    expect(loginTokens).toEqual(["token-1", "token-2"]);
  });
});
