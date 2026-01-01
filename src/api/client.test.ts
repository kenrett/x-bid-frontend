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
    authTokenStore.setToken(null);
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
      "Your session expired; please sign in again.",
      "error",
    );
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("keeps maintenance redirect behavior for 503", async () => {
    setPath("/auctions");
    const error = { response: { status: 503 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);

    expect(window.location.assign).toHaveBeenCalledWith("/maintenance");
  });
});
