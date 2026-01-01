import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AxiosError } from "axios";
import { authTokenStore } from "@features/auth/tokenStore";

const showToast = vi.fn();
vi.mock("@services/toast", () => ({
  showToast: (...args: unknown[]): void => {
    showToast(...args);
  },
}));

// Import after mocks so interceptors use the mocked toast
import client from "./client";

const applyRequestInterceptors = (config: Record<string, unknown>) => {
  const handlers = (
    client.interceptors.request as unknown as {
      handlers: Array<{ fulfilled?: (value: unknown) => unknown }>;
    }
  ).handlers;
  return handlers.reduce((current, handler) => {
    if (!handler.fulfilled) return current;
    return handler.fulfilled(current) as Record<string, unknown>;
  }, config);
};

const getRejectedInterceptor = () => {
  const handlers = (
    client.interceptors.response as unknown as {
      handlers: Array<{ rejected?: (error: unknown) => unknown }>;
    }
  ).handlers;
  const handler = handlers.find((h) => typeof h.rejected === "function");
  if (!handler?.rejected) {
    throw new Error("Response interceptor not registered");
  }
  return handler.rejected;
};

const setPath = (pathname: string) => {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      assign: vi.fn(),
    },
    writable: true,
  });
};

describe("api client response interceptor", () => {
  const rejected = getRejectedInterceptor();

  beforeEach(() => {
    authTokenStore.clear();
    showToast.mockClear();
    vi.restoreAllMocks();
  });

  it("attaches Authorization header only when token is in memory", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const baseConfig = { url: "/api/v1/example", headers: {} };

    const withoutToken = applyRequestInterceptors({ ...baseConfig });
    expect(
      (withoutToken.headers as Record<string, unknown>).Authorization,
    ).toBe(undefined);

    authTokenStore.setToken("abc");
    const withToken = applyRequestInterceptors({ ...baseConfig });
    expect((withToken.headers as Record<string, unknown>).Authorization).toBe(
      "Bearer abc",
    );

    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it("handles 401/403 by dispatching unauthorized and toasting", async () => {
    setPath("/auctions");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const error = { response: { status: 401 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "app:unauthorized" }),
    );
    expect(showToast).toHaveBeenCalledWith(
      "Session expired. Please log in again.",
      "error",
    );
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("refreshes on 401 with in-memory refreshToken and retries once", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const postSpy = vi.spyOn(client, "post");
    const requestSpy = vi.spyOn(client, "request");

    authTokenStore.setSession({
      token: "old-token",
      refreshToken: "refresh-1",
      sessionTokenId: "sid-1",
    });

    postSpy.mockResolvedValueOnce({
      data: {
        token: "new-token",
        refresh_token: "refresh-2",
        session_token_id: "sid-2",
        user: {
          id: 1,
          email: "user@example.com",
          name: "User",
          bidCredits: 0,
          is_admin: false,
        },
      },
    } as never);

    requestSpy.mockResolvedValueOnce({ data: "ok" } as never);

    const error = {
      response: { status: 401 },
      config: { url: "/api/v1/protected", headers: {} },
    } as AxiosError;

    await expect(rejected(error)).resolves.toMatchObject({ data: "ok" });

    expect(postSpy).toHaveBeenCalledWith(
      "/api/v1/session/refresh",
      { refresh_token: "refresh-1" },
      { headers: { Authorization: undefined } },
    );

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "app:auth:refreshed" }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(1);
    const retriedConfig = requestSpy.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(retriedConfig.__authRetry).toBe(true);
  });

  it("dispatches unauthorized when refresh fails", async () => {
    setPath("/auctions");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const postSpy = vi.spyOn(client, "post").mockRejectedValueOnce(
      Object.assign(new Error("refresh failed"), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    );

    authTokenStore.setSession({
      token: "old-token",
      refreshToken: "refresh-1",
      sessionTokenId: "sid-1",
    });

    const error = {
      response: { status: 401 },
      config: { url: "/api/v1/protected", headers: {} },
    } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(postSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "app:unauthorized" }),
    );
    expect(showToast).toHaveBeenCalledWith(
      "Session expired. Please log in again.",
      "error",
    );
  });

  it("keeps maintenance redirect behavior for 503", async () => {
    setPath("/auctions");
    const error = { response: { status: 503 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(window.location.assign).toHaveBeenCalledWith("/maintenance");
  });
});
